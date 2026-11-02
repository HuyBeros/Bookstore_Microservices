package com.bookstore.userservices.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * DTO chứa thông tin yêu cầu đăng nhập của người dùng.
 * Cho phép đăng nhập linh hoạt bằng username hoặc email kèm mật khẩu.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

    @NotBlank(message = "Tên đăng nhập hoặc email không được để trống")
    private String usernameOrEmail;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;
}
