package com.bookstore.userservices.entity;

/**
 * Enum định nghĩa các trạng thái tài khoản của người dùng.
 * - ACTIVE: Tài khoản đang hoạt động bình thường, được phép đăng nhập và sử dụng dịch vụ.
 * - LOCKED: Tài khoản đã bị Quản trị viên khóa, bị từ chối đăng nhập và truy cập tài nguyên.
 */
public enum UserStatus {
    ACTIVE,
    LOCKED
}
