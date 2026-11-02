package com.bookstore.userservices.service;

/**
 * Giao diện định nghĩa dịch vụ giới hạn tần suất gọi API (Rate Limiting).
 * Sử dụng thuật toán Token Bucket để chống tấn công brute-force vào các chức năng nhạy cảm.
 */
public interface RateLimitService {

    /**
     * Thử tiêu thụ 1 token cho hành động đăng nhập của một định danh (username hoặc IP).
     *
     * @param identifier định danh của đối tượng đăng nhập (username hoặc email)
     * @return true nếu còn lượt đăng nhập hợp lệ, false nếu đã vượt ngưỡng giới hạn
     */
    boolean tryConsumeLogin(String identifier);

    /**
     * Khôi phục hoặc xóa bỏ giới hạn lượt thử đăng nhập khi người dùng đăng nhập thành công.
     *
     * @param identifier định danh của đối tượng đăng nhập
     */
    void resetLoginLimit(String identifier);
}
