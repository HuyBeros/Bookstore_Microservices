package com.bookstore.userservices.dto.request;

import com.bookstore.userservices.entity.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

/**
 * DTO chứa thông tin yêu cầu thay đổi trạng thái tài khoản người dùng (dành riêng cho ADMIN).
 * Các trạng thái hỗ trợ: ACTIVE (hoạt động), LOCKED (bị khóa).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserStatusRequest {

    @NotNull(message = "Trạng thái tài khoản không được để trống")
    private UserStatus status;
}
