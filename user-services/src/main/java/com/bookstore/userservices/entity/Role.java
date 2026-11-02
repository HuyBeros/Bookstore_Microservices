package com.bookstore.userservices.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Thực thể ánh xạ bảng 'roles' trong cơ sở dữ liệu PostgreSQL.
 * Lưu trữ danh mục vai trò người dùng trong hệ thống (ADMIN, STAFF, CUSTOMER).
 */
@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "role_id")
    private Integer roleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_name", nullable = false, unique = true, length = 50)
    private RoleName roleName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
