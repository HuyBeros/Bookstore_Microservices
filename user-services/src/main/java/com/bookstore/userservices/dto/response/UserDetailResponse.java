package com.bookstore.userservices.dto.response;

import com.bookstore.userservices.entity.User;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * DTO chứa thông tin chi tiết của người dùng trả về cho Client.
 * Loại bỏ trường nhạy cảm (password) và chuyển đổi các đối tượng Role, Status sang dạng chuỗi thân thiện.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDetailResponse implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long userId;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private String address;
    private String status;
    private String role;
    private LocalDateTime createdAt;

    /**
     * Chuyển đổi an toàn từ Entity User sang DTO UserDetailResponse.
     *
     * @param user thực thể người dùng từ CSDL
     * @return đối tượng UserDetailResponse hoặc null nếu user là null
     */
    public static UserDetailResponse fromEntity(User user) {
        if (user == null) {
            return null;
        }
        return UserDetailResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .role(user.getRole() != null && user.getRole().getRoleName() != null ? user.getRole().getRoleName().name() : null)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
