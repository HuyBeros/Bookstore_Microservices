package com.bookstore.userservices.service;

import com.bookstore.userservices.dto.request.ChangePasswordRequest;
import com.bookstore.userservices.dto.request.UpdateProfileRequest;
import com.bookstore.userservices.dto.response.PageResponse;
import com.bookstore.userservices.dto.response.UserDetailResponse;
import com.bookstore.userservices.entity.RoleName;
import com.bookstore.userservices.entity.UserStatus;

/**
 * Giao diện định nghĩa các dịch vụ quản lý hồ sơ người dùng và các thao tác quản trị tài khoản của ADMIN.
 */
public interface UserService {

    /**
     * Lấy thông tin hồ sơ của người dùng đang đăng nhập.
     *
     * @param currentUsername tên đăng nhập của user trích xuất từ JWT token
     * @return DTO chi tiết thông tin tài khoản người dùng
     * @throws com.bookstore.userservices.exception.AppException nếu không tìm thấy người dùng
     */
    UserDetailResponse getProfile(String currentUsername);

    /**
     * Cập nhật thông tin hồ sơ cá nhân (họ tên, email, số điện thoại, địa chỉ).
     *
     * @param currentUsername tên đăng nhập của user đang đăng nhập
     * @param request thông tin cập nhật mới
     * @return DTO chi tiết người dùng sau khi cập nhật
     * @throws com.bookstore.userservices.exception.AppException nếu email mới đã bị người khác sử dụng
     */
    UserDetailResponse updateProfile(String currentUsername, UpdateProfileRequest request);

    /**
     * Đổi mật khẩu tài khoản người dùng.
     *
     * @param currentUsername tên đăng nhập của user đang đăng nhập
     * @param request thông tin gồm mật khẩu cũ và mật khẩu mới
     * @throws com.bookstore.userservices.exception.AppException nếu mật khẩu cũ không chính xác
     */
    void changePassword(String currentUsername, ChangePasswordRequest request);

    /**
     * [ADMIN] Xem chi tiết thông tin của một người dùng theo ID.
     *
     * @param userId định danh của người dùng cần xem
     * @return DTO chi tiết người dùng
     * @throws com.bookstore.userservices.exception.AppException nếu không tìm thấy user với ID tương ứng
     */
    UserDetailResponse getUserById(Long userId);

    /**
     * [ADMIN] Lấy danh sách người dùng có hỗ trợ phân trang, tìm kiếm từ khóa và lọc theo vai trò/trạng thái.
     *
     * @param pageNo chỉ số trang (bắt đầu từ 0)
     * @param pageSize số bản ghi trên mỗi trang
     * @param keyword từ khóa tìm kiếm (theo username, email hoặc fullName)
     * @param role lọc theo vai trò người dùng (ADMIN, STAFF, CUSTOMER)
     * @param status lọc theo trạng thái tài khoản (ACTIVE, LOCKED)
     * @return đối tượng PageResponse chứa danh sách và thông tin phân trang
     */
    PageResponse<UserDetailResponse> getAllUsers(int pageNo, int pageSize, String keyword, RoleName role, UserStatus status);

    /**
     * [ADMIN] Khóa hoặc mở khóa tài khoản của người dùng.
     * Quy tắc nghiệp vụ: Admin không được phép tự khóa tài khoản của chính mình.
     *
     * @param currentAdminUsername tên đăng nhập của admin đang thực hiện thao tác
     * @param targetUserId định danh của người dùng mục tiêu
     * @param newStatus trạng thái mới cần cập nhật (ACTIVE hoặc LOCKED)
     * @return DTO chi tiết người dùng sau khi cập nhật trạng thái
     * @throws com.bookstore.userservices.exception.AppException nếu targetUserId không tồn tại hoặc admin tự khóa chính mình
     */
    UserDetailResponse updateUserStatus(String currentAdminUsername, Long targetUserId, UserStatus newStatus);

    /**
     * [ADMIN] Phân quyền vai trò mới cho người dùng.
     * Quy tắc nghiệp vụ: Admin không được phép tự hạ quyền của chính mình.
     *
     * @param currentAdminUsername tên đăng nhập của admin đang thực hiện thao tác
     * @param targetUserId định danh của người dùng mục tiêu
     * @param newRole vai trò mới cần gán (ADMIN, STAFF, CUSTOMER)
     * @return DTO chi tiết người dùng sau khi cập nhật vai trò
     * @throws com.bookstore.userservices.exception.AppException nếu targetUserId không tồn tại, role không hợp lệ hoặc admin tự hạ quyền
     */
    UserDetailResponse updateUserRole(String currentAdminUsername, Long targetUserId, RoleName newRole);
}
