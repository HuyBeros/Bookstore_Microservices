package com.bookstore.userservices.service;

/**
 * Giao diện dịch vụ quản lý danh sách đen các JWT token đã bị thu hồi (đăng xuất).
 */
public interface TokenBlacklistService {

    /**
     * Đưa token vào danh sách đen với thời gian sống tương ứng với hạn còn lại của token.
     *
     * @param token chuỗi JWT token
     * @param expirationMillis thời gian sống còn lại tính bằng mili-giây
     */
    void blacklistToken(String token, long expirationMillis);

    /**
     * Kiểm tra token có nằm trong danh sách đen (đã đăng xuất) hay không.
     *
     * @param token chuỗi JWT token
     * @return true nếu token đã bị vô hiệu hóa
     */
    boolean isBlacklisted(String token);
}
