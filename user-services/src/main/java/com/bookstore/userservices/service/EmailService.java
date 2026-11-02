package com.bookstore.userservices.service;

/**
 * Giao diện dịch vụ gửi email thông báo và mã xác thực cho người dùng.
 */
public interface EmailService {

    /**
     * Gửi email chứa mã OTP khôi phục mật khẩu đến người dùng.
     *
     * @param toEmail địa chỉ email người nhận
     * @param otp mã OTP gồm 6 chữ số
     */
    void sendOtpEmail(String toEmail, String otp);
}
