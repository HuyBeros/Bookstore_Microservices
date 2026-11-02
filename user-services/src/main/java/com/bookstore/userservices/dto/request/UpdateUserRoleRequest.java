package com.bookstore.userservices.dto.request;

import com.bookstore.userservices.entity.RoleName;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * DTO chứa thông tin yêu cầu cập nhật vai trò người dùng (dành riêng cho ADMIN).
 * Các vai trò hỗ trợ: ADMIN, STAFF, CUSTOMER.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserRoleRequest {

    @NotNull(message = "Vai trò không được để trống")
    private RoleName role;
}
