package com.bookstore.userservices.controller;

import com.bookstore.userservices.dto.request.ForgotPasswordRequest;
import com.bookstore.userservices.dto.request.LoginRequest;
import com.bookstore.userservices.dto.request.RefreshTokenRequest;
import com.bookstore.userservices.dto.request.RegisterRequest;
import com.bookstore.userservices.dto.request.ResetPasswordRequest;
import com.bookstore.userservices.dto.request.VerifyOtpRequest;
import com.bookstore.userservices.dto.response.ApiResponse;
import com.bookstore.userservices.dto.response.AuthResponse;
import com.bookstore.userservices.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller tiếp nhận và xử lý các yêu cầu liên quan đến xác thực người dùng.
 * Bao gồm: Đăng ký tài khoản mới, Đăng nhập, Cấp mới Access Token, Đăng xuất (Blacklist) và Khôi phục mật khẩu qua OTP.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Endpoint đăng ký tài khoản khách hàng mới.
     *
     * @param request dữ liệu đăng ký hợp lệ từ người dùng
     * @return HTTP 201 Created kèm ApiResponse chứa thông tin tài khoản và cặp token
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Đăng ký tài khoản thành công"));
    }

    /**
     * Endpoint đăng nhập vào hệ thống.
     *
     * @param request thông tin đăng nhập gồm username/email và mật khẩu
     * @return HTTP 200 OK kèm ApiResponse chứa thông tin đăng nhập và token
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Đăng nhập thành công"));
    }

    /**
     * Endpoint làm mới Access Token bằng Refresh Token.
     *
     * @param request dữ liệu chứa refresh token còn hạn
     * @return HTTP 200 OK kèm cặp token mới
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Làm mới token thành công"));
    }

    /**
     * Endpoint đăng xuất khỏi hệ thống và đưa Access Token vào Redis Blacklist.
     *
     * @param authHeader giá trị header Authorization dạng "Bearer <token>"
     * @return HTTP 200 OK thông báo đăng xuất thành công
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        authService.logout(authHeader);
        return ResponseEntity.ok(ApiResponse.success(null, "Đăng xuất thành công"));
    }

    /**
     * Endpoint yêu cầu khôi phục mật khẩu qua email (sinh mã OTP 6 số).
     *
     * @param request dữ liệu chứa email cần khôi phục
     * @return HTTP 200 OK
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Mã xác thực OTP đã được gửi đến email của bạn"));
    }

    /**
     * Endpoint xác thực mã OTP nhập vào.
     *
     * @param request dữ liệu gồm email và mã OTP
     * @return HTTP 200 OK
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Mã xác thực OTP hợp lệ"));
    }

    /**
     * Endpoint đặt lại mật khẩu mới.
     *
     * @param request dữ liệu gồm email, mã OTP và mật khẩu mới
     * @return HTTP 200 OK
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại"));
    }
}
