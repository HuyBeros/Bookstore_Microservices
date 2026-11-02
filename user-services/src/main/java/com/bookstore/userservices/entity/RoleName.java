package com.bookstore.userservices.entity;

/**
 * Enum định nghĩa các vai trò người dùng trong hệ thống StudyMate.
 * - ADMIN: Quản trị viên cao nhất, toàn quyền quản lý hệ thống và người dùng.
 * - STAFF: Nhân viên quản lý kho và xử lý đơn hàng.
 * - CUSTOMER: Khách hàng mua sắm sách và quản lý thông tin cá nhân.
 */
public enum RoleName {
    ADMIN,
    STAFF,
    CUSTOMER
}
