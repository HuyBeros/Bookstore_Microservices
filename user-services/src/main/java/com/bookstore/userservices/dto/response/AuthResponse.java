package com.bookstore.userservices.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin kết quả xác thực tài khoản trả về sau khi Đăng ký, Đăng nhập hoặc Refresh Token thành công.
 * Bao gồm Access Token (ngắn hạn), Refresh Token (dài hạn) và thông tin cơ bản của người dùng.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response chứa access token và refresh token sau khi đăng nhập/đăng ký")
public class AuthResponse {

    @Schema(description = "JWT Access Token (expires in 1 hour)", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String accessToken;

    @Schema(description = "JWT Refresh Token (expires in 7 days)", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String refreshToken;

    @Builder.Default
    @Schema(description = "Loại token", example = "Bearer")
    private String tokenType = "Bearer";

    @Schema(description = "User ID", example = "1")
    private Long userId;

    @Schema(description = "Tên đăng nhập", example = "johndoe")
    private String username;

    @Schema(description = "Email", example = "johndoe@example.com")
    private String email;

    @Schema(description = "Họ và tên", example = "Nguyễn Văn A")
    private String fullName;

    @Schema(description = "Vai trò", example = "CUSTOMER")
    private String role;
}
