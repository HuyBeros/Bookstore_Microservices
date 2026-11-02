package com.bookstore.userservices.controller;

import com.bookstore.userservices.dto.request.UpdateUserRoleRequest;
import com.bookstore.userservices.dto.request.UpdateUserStatusRequest;
import com.bookstore.userservices.dto.response.ApiResponse;
import com.bookstore.userservices.dto.response.PageResponse;
import com.bookstore.userservices.dto.response.UserDetailResponse;
import com.bookstore.userservices.entity.RoleName;
import com.bookstore.userservices.entity.UserStatus;
import com.bookstore.userservices.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * Controller dành riêng cho Quản trị viên (ADMIN) để quản lý danh sách và tài khoản người dùng trong hệ thống.
 * Toàn bộ các endpoint trong controller này được bảo vệ nghiêm ngặt bằng vai trò ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    /**
     * Endpoint lấy danh sách người dùng với các tiêu chí tìm kiếm, lọc và phân trang.
     *
     * @param pageNo số trang cần lấy (mặc định 0)
     * @param pageSize số bản ghi mỗi trang (mặc định 10)
     * @param keyword từ khóa tìm kiếm (username, email, họ tên)
     * @param role lọc theo vai trò (ADMIN, STAFF, CUSTOMER)
     * @param status lọc theo trạng thái tài khoản (ACTIVE, LOCKED)
     * @return HTTP 200 OK kèm danh sách người dùng phân trang
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<UserDetailResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) RoleName role,
            @RequestParam(required = false) UserStatus status
    ) {
        PageResponse<UserDetailResponse> response = userService.getAllUsers(pageNo, pageSize, keyword, role, status);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy danh sách người dùng thành công"));
    }

    /**
     * Endpoint xem thông tin chi tiết một người dùng cụ thể bằng ID.
     *
     * @param userId mã định danh của người dùng
     * @return HTTP 200 OK kèm thông tin chi tiết người dùng
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserDetailResponse>> getUserById(@PathVariable Long userId) {
        UserDetailResponse response = userService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết người dùng thành công"));
    }

    /**
     * Endpoint khóa hoặc mở khóa tài khoản người dùng.
     *
     * @param adminDetails thông tin admin thực hiện thao tác
     * @param userId mã định danh của user bị tác động
     * @param request dữ liệu trạng thái mới (ACTIVE hoặc LOCKED)
     * @return HTTP 200 OK kèm thông tin user sau cập nhật
     */
    @PatchMapping("/{userId}/status")
    public ResponseEntity<ApiResponse<UserDetailResponse>> updateUserStatus(
            @AuthenticationPrincipal UserDetails adminDetails,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        UserDetailResponse response = userService.updateUserStatus(adminDetails.getUsername(), userId, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật trạng thái người dùng thành công"));
    }

    /**
     * Endpoint phân quyền vai trò người dùng (ADMIN, STAFF, CUSTOMER).
     *
     * @param adminDetails thông tin admin thực hiện thao tác
     * @param userId mã định danh của user bị tác động
     * @param request dữ liệu vai trò mới
     * @return HTTP 200 OK kèm thông tin user sau cập nhật
     */
    @PatchMapping("/{userId}/role")
    public ResponseEntity<ApiResponse<UserDetailResponse>> updateUserRole(
            @AuthenticationPrincipal UserDetails adminDetails,
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        UserDetailResponse response = userService.updateUserRole(adminDetails.getUsername(), userId, request.getRole());
        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật vai trò người dùng thành công"));
    }
}
