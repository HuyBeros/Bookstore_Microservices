package com.bookstore.userservices.service.impl;

import com.bookstore.userservices.dto.request.ChangePasswordRequest;
import com.bookstore.userservices.dto.request.UpdateProfileRequest;
import com.bookstore.userservices.dto.response.PageResponse;
import com.bookstore.userservices.dto.response.UserDetailResponse;
import com.bookstore.userservices.entity.Role;
import com.bookstore.userservices.entity.RoleName;
import com.bookstore.userservices.entity.User;
import com.bookstore.userservices.entity.UserStatus;
import com.bookstore.userservices.exception.AppException;
import com.bookstore.userservices.repository.RoleRepository;
import com.bookstore.userservices.repository.UserRepository;
import com.bookstore.userservices.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Lớp cài đặt các dịch vụ quản lý hồ sơ người dùng và các thao tác quản trị tài khoản dành cho ADMIN.
 * Đảm bảo các quy tắc nghiệp vụ: toàn vẹn dữ liệu, mật khẩu mã hóa BCrypt, chặn Admin tự khóa/hạ quyền.
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final int MAX_PAGE_SIZE = 100;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Lấy thông tin hồ sơ của người dùng đang đăng nhập.
     *
     * @param currentUsername tên đăng nhập của user từ token
     * @return DTO chi tiết thông tin người dùng
     * @throws AppException nếu không tìm thấy user
     */
    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "user_profiles", key = "#currentUsername", unless = "#result == null")
    public UserDetailResponse getProfile(String currentUsername) {
        User user = getUserByUsername(currentUsername);
        return UserDetailResponse.fromEntity(user);
    }

    /**
     * Cập nhật thông tin hồ sơ cá nhân.
     * Kiểm tra nếu người dùng đổi email thì email mới không được trùng với tài khoản khác.
     *
     * @param currentUsername tên đăng nhập của user hiện tại
     * @param request dữ liệu cập nhật (họ tên, email, số điện thoại, địa chỉ)
     * @return DTO chi tiết sau khi lưu thành công
     * @throws AppException nếu email mới đã bị người khác sử dụng
     */
    @Override
    @Transactional
    @CacheEvict(value = "user_profiles", key = "#currentUsername")
    public UserDetailResponse updateProfile(String currentUsername, UpdateProfileRequest request) {
        User user = getUserByUsername(currentUsername);

        // Kiểm tra xem email mới có bị trùng với người dùng khác hay không
        validateEmailUniqueForUser(request.getEmail(), user.getUserId());

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setAddress(request.getAddress());

        User updatedUser = userRepository.save(user);
        return UserDetailResponse.fromEntity(updatedUser);
    }

    /**
     * Đổi mật khẩu tài khoản người dùng.
     * Xác thực mật khẩu cũ bằng BCrypt trước khi mã hóa và lưu mật khẩu mới.
     * 
     * Business Rules:
     * - Mật khẩu cũ phải đúng
     * - Mật khẩu mới không được trùng với mật khẩu cũ
     *
     * @param currentUsername tên đăng nhập của user hiện tại
     * @param request dữ liệu gồm mật khẩu cũ và mật khẩu mới
     * @throws AppException nếu mật khẩu cũ không chính xác hoặc mật khẩu mới trùng cũ
     */
    @Override
    @Transactional
    @CacheEvict(value = "user_profiles", key = "#currentUsername")
    public void changePassword(String currentUsername, ChangePasswordRequest request) {
        User user = getUserByUsername(currentUsername);

        // Kiểm tra mật khẩu cũ có khớp với mã băm trong CSDL không
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new AppException("Mật khẩu hiện tại không chính xác", HttpStatus.BAD_REQUEST);
        }

        // Business Rule: Mật khẩu mới không được trùng với mật khẩu cũ
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new AppException("Mật khẩu mới không được trùng với mật khẩu hiện tại", HttpStatus.BAD_REQUEST);
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * [ADMIN] Xem thông tin chi tiết của người dùng bất kỳ theo ID.
     *
     * @param userId định danh của user
     * @return DTO chi tiết người dùng
     * @throws AppException nếu không tìm thấy user
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetailResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException("Không tìm thấy người dùng với ID: " + userId, HttpStatus.NOT_FOUND));
        return UserDetailResponse.fromEntity(user);
    }

    /**
     * [ADMIN] Lấy danh sách người dùng hỗ trợ phân trang, tìm kiếm từ khóa và lọc theo vai trò/trạng thái.
     *
     * @param pageNo chỉ số trang (0-indexed)
     * @param pageSize kích thước trang (tối đa 100)
     * @param keyword từ khóa tìm kiếm (username, email, họ tên)
     * @param role vai trò cần lọc (ADMIN, STAFF, CUSTOMER)
     * @param status trạng thái tài khoản (ACTIVE, LOCKED)
     * @return PageResponse bọc danh sách DTO và metadata phân trang
     */
    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserDetailResponse> getAllUsers(int pageNo, int pageSize, String keyword, RoleName role, UserStatus status) {
        int page = Math.max(pageNo, 0);
        int size = pageSize > 0 ? Math.min(pageSize, MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<User> userPage = userRepository.searchUsers(keyword, role, status, pageable);
        List<UserDetailResponse> items = userPage.getContent().stream()
                .map(UserDetailResponse::fromEntity)
                .toList();

        return PageResponse.<UserDetailResponse>builder()
                .pageNo(userPage.getNumber())
                .pageSize(userPage.getSize())
                .totalPages(userPage.getTotalPages())
                .totalElements(userPage.getTotalElements())
                .last(userPage.isLast())
                .items(items)
                .build();
    }

    /**
     * [ADMIN] Khóa hoặc Mở khóa tài khoản người dùng.
     * Ràng buộc nghiệp vụ: Quản trị viên không được phép tự khóa chính mình để tránh mất quyền quản trị hệ thống.
     *
     * @param currentAdminUsername username của admin đang thao tác
     * @param targetUserId ID của user bị tác động
     * @param newStatus trạng thái mới (ACTIVE hoặc LOCKED)
     * @return DTO người dùng sau khi đổi trạng thái
     * @throws AppException nếu admin tự khóa bản thân hoặc không tìm thấy user
     */
    @Override
    @Transactional
    @CacheEvict(value = "user_profiles", allEntries = true)
    public UserDetailResponse updateUserStatus(String currentAdminUsername, Long targetUserId, UserStatus newStatus) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new AppException("Không tìm thấy người dùng với ID: " + targetUserId, HttpStatus.NOT_FOUND));

        // Chặn admin tự khóa tài khoản để bảo đảm hệ thống luôn còn ít nhất 1 admin hoạt động
        if (targetUser.getUsername().equalsIgnoreCase(currentAdminUsername) && newStatus == UserStatus.LOCKED) {
            throw new AppException("Quản trị viên không được phép tự khóa tài khoản của chính mình", HttpStatus.BAD_REQUEST);
        }

        targetUser.setStatus(newStatus);
        User savedUser = userRepository.save(targetUser);
        return UserDetailResponse.fromEntity(savedUser);
    }

    /**
     * [ADMIN] Phân quyền vai trò mới cho người dùng.
     * Ràng buộc nghiệp vụ: Quản trị viên không được phép tự hạ quyền của chính mình xuống vai trò thấp hơn.
     *
     * @param currentAdminUsername username của admin đang thao tác
     * @param targetUserId ID của user bị tác động
     * @param newRole vai trò mới (ADMIN, STAFF, CUSTOMER)
     * @return DTO người dùng sau khi đổi vai trò
     * @throws AppException nếu admin tự hạ quyền hoặc không tìm thấy user
     */
    @Override
    @Transactional
    @CacheEvict(value = "user_profiles", allEntries = true)
    public UserDetailResponse updateUserRole(String currentAdminUsername, Long targetUserId, RoleName newRole) {
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new AppException("Không tìm thấy người dùng với ID: " + targetUserId, HttpStatus.NOT_FOUND));

        // Chặn admin tự hạ vai trò của chính mình để tránh vô tình mất quyền quản trị
        if (targetUser.getUsername().equalsIgnoreCase(currentAdminUsername) && newRole != RoleName.ADMIN) {
            throw new AppException("Quản trị viên không thể tự hạ quyền vai trò của chính mình", HttpStatus.BAD_REQUEST);
        }

        Role role = roleRepository.findByRoleName(newRole)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .roleName(newRole)
                        .description(newRole.name())
                        .build()));

        targetUser.setRole(role);
        User savedUser = userRepository.save(targetUser);
        return UserDetailResponse.fromEntity(savedUser);
    }

    /**
     * Kiểm tra tính duy nhất của email, ngoại trừ chính người dùng đang cập nhật.
     */
    private void validateEmailUniqueForUser(String email, Long currentUserId) {
        userRepository.findByEmail(email).ifPresent(existingUser -> {
            if (!existingUser.getUserId().equals(currentUserId)) {
                throw new AppException("Email '" + email + "' đã được sử dụng bởi tài khoản khác", HttpStatus.BAD_REQUEST);
            }
        });
    }

    /**
     * Tìm kiếm người dùng theo username, ném ngoại lệ 404 nếu không tìm thấy.
     */
    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException("Không tìm thấy thông tin tài khoản: " + username, HttpStatus.NOT_FOUND));
    }
}
