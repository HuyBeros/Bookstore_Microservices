package com.bookstore.userservices.service.impl;

import com.bookstore.userservices.dto.request.ForgotPasswordRequest;
import com.bookstore.userservices.dto.request.LoginRequest;
import com.bookstore.userservices.dto.request.RefreshTokenRequest;
import com.bookstore.userservices.dto.request.RegisterRequest;
import com.bookstore.userservices.dto.request.ResetPasswordRequest;
import com.bookstore.userservices.dto.request.VerifyOtpRequest;
import com.bookstore.userservices.dto.response.AuthResponse;
import com.bookstore.userservices.entity.Role;
import com.bookstore.userservices.entity.RoleName;
import com.bookstore.userservices.entity.User;
import com.bookstore.userservices.entity.UserStatus;
import com.bookstore.userservices.exception.AppException;
import com.bookstore.userservices.repository.RoleRepository;
import com.bookstore.userservices.repository.UserRepository;
import com.bookstore.userservices.security.JwtService;
import com.bookstore.userservices.service.AuthService;
import com.bookstore.userservices.service.EmailService;
import com.bookstore.userservices.service.OtpService;
import com.bookstore.userservices.service.RateLimitService;
import com.bookstore.userservices.service.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Lớp cài đặt các nghiệp vụ xác thực người dùng và quản lý phiên làm việc.
 * Xử lý: Đăng ký tài khoản CUSTOMER, Đăng nhập (kèm Rate Limiting và kiểm tra khóa tài khoản), Cấp mới Access Token qua Refresh Token.
 */
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RateLimitService rateLimitService;
    private final TokenBlacklistService tokenBlacklistService;
    private final OtpService otpService;
    private final EmailService emailService;

    /**
     * Đăng ký tài khoản khách hàng mới vào hệ thống.
     *
     * @param request thông tin đăng ký tài khoản (tên đăng nhập, mật khẩu, họ tên, email, ...)
     * @return thông tin xác thực kèm cặp token mới
     * @throws AppException nếu username hoặc email đã tồn tại
     */
    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Kiểm tra tính duy nhất của username và email trước khi tạo tài khoản
        validateUserUniqueness(request.getUsername(), request.getEmail());

        Role customerRole = getOrCreateCustomerRole();

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .status(UserStatus.ACTIVE)
                .role(customerRole)
                .build();

        User savedUser = userRepository.save(user);
        String accessToken = jwtService.generateToken(savedUser);
        String refreshToken = jwtService.generateRefreshToken(savedUser);

        return mapToAuthResponse(savedUser, accessToken, refreshToken);
    }

    /**
     * Đăng nhập hệ thống bằng username hoặc email và mật khẩu.
     * Áp dụng Rate Limiting để ngăn chặn tấn công dò mật khẩu (Brute-force).
     *
     * @param request thông tin đăng nhập gồm username/email và mật khẩu
     * @return thông tin xác thực kèm cặp token mới
     * @throws AppException nếu vượt giới hạn đăng nhập, sai thông tin hoặc tài khoản bị khóa
     */
    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getUsernameOrEmail();

        // Kiểm tra giới hạn số lần thử đăng nhập (Rate Limiting)
        if (!rateLimitService.tryConsumeLogin(identifier)) {
            throw new AppException("Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.", HttpStatus.TOO_MANY_REQUESTS);
        }

        User user = userRepository.findByUsernameOrEmail(identifier, identifier)
                .orElseThrow(() -> new AppException("Tên đăng nhập hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED));

        // Kiểm tra mật khẩu mã hóa BCrypt
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AppException("Tên đăng nhập hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED);
        }

        // Chặn người dùng đăng nhập nếu tài khoản đã bị Quản trị viên khóa
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new AppException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.", HttpStatus.FORBIDDEN);
        }

        // Đăng nhập thành công -> Reset bộ đếm số lần thử đăng nhập thất bại
        rateLimitService.resetLoginLimit(identifier);

        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return mapToAuthResponse(user, accessToken, refreshToken);
    }

    /**
     * Cấp phát Access Token mới bằng Refresh Token hợp lệ còn thời hạn.
     *
     * @param request thông tin yêu cầu chứa refresh token
     * @return thông tin xác thực kèm cặp token mới
     * @throws AppException nếu refresh token không hợp lệ, hết hạn hoặc tài khoản bị khóa
     */
    @Override
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        String username = jwtService.extractUsername(refreshToken);

        if (username == null) {
            throw new AppException("Refresh token không hợp lệ", HttpStatus.UNAUTHORIZED);
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException("Không tìm thấy người dùng", HttpStatus.NOT_FOUND));

        if (user.getStatus() == UserStatus.LOCKED) {
            throw new AppException("Tài khoản của bạn đã bị khóa", HttpStatus.FORBIDDEN);
        }

        // Kiểm tra tính toàn vẹn và hạn sử dụng của refresh token
        if (!jwtService.isRefreshTokenValid(refreshToken, user)) {
            throw new AppException("Refresh token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED);
        }

        String newAccessToken = jwtService.generateToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        return mapToAuthResponse(user, newAccessToken, newRefreshToken);
    }

    /**
     * Kiểm tra username và email đã tồn tại trong CSDL chưa.
     */
    private void validateUserUniqueness(String username, String email) {
        if (userRepository.existsByUsername(username)) {
            throw new AppException("Tên đăng nhập '" + username + "' đã tồn tại trong hệ thống", HttpStatus.BAD_REQUEST);
        }
        if (userRepository.existsByEmail(email)) {
            throw new AppException("Email '" + email + "' đã được sử dụng", HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Lấy vai trò CUSTOMER từ CSDL hoặc tự động khởi tạo nếu chưa có.
     */
    private Role getOrCreateCustomerRole() {
        return roleRepository.findByRoleName(RoleName.CUSTOMER)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .roleName(RoleName.CUSTOMER)
                        .description("Khách hàng mua sách")
                        .build()));
    }

    /**
     * Chuyển đổi thông tin User và cặp Token sang DTO AuthResponse chuẩn.
     */
    private AuthResponse mapToAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getRoleName().name())
                .build();
    }

    /**
     * Đăng xuất khỏi hệ thống: tính thời gian sống còn lại và đưa Access Token vào Redis Blacklist.
     */
    @Override
    public void logout(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return;
        }

        String token = authHeader.substring(7);
        long remainingExpiration = jwtService.getRemainingExpiration(token);
        if (remainingExpiration > 0) {
            tokenBlacklistService.blacklistToken(token, remainingExpiration);
        }

        SecurityContextHolder.clearContext();
    }

    /**
     * Quên mật khẩu: Kiểm tra user tồn tại, tạo mã OTP và gửi email.
     */
    @Override
    @Transactional(readOnly = true)
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new AppException("Không tìm thấy tài khoản với email: " + request.getEmail(), HttpStatus.NOT_FOUND));

        if (user.getStatus() == UserStatus.LOCKED) {
            throw new AppException("Tài khoản của bạn đã bị khóa, không thể khôi phục mật khẩu", HttpStatus.FORBIDDEN);
        }

        String otp = otpService.generateOtp(user.getEmail());
        emailService.sendOtpEmail(user.getEmail(), otp);
    }

    /**
     * Xác thực tính hợp lệ của mã OTP.
     */
    @Override
    public boolean verifyOtp(VerifyOtpRequest request) {
        boolean isValid = otpService.verifyOtp(request.getEmail(), request.getOtp());
        if (!isValid) {
            throw new AppException("Mã OTP không chính xác hoặc đã hết hạn", HttpStatus.BAD_REQUEST);
        }
        return true;
    }

    /**
     * Đặt lại mật khẩu mới thông qua mã OTP xác thực.
     */
    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        boolean isValid = otpService.verifyOtp(request.getEmail(), request.getOtp());
        if (!isValid) {
            throw new AppException("Mã OTP không chính xác hoặc đã hết hạn", HttpStatus.BAD_REQUEST);
        }

        User user = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new AppException("Không tìm thấy tài khoản với email: " + request.getEmail(), HttpStatus.NOT_FOUND));

        if (user.getStatus() == UserStatus.LOCKED) {
            throw new AppException("Tài khoản của bạn đã bị khóa", HttpStatus.FORBIDDEN);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Xóa mã OTP sau khi sử dụng thành công
        otpService.clearOtp(request.getEmail());
    }
}
