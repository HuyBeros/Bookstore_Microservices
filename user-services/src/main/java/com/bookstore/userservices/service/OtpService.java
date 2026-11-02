package com.bookstore.userservices.service;

/**
 * Giao diện quản lý mã OTP (One-Time Password) phục vụ xác thực và khôi phục mật khẩu.
 */
public interface OtpService {

    /**
     * Sinh mã OTP 6 chữ số ngẫu nhiên an toàn và lưu vào Redis với thời hạn TTL.
     *
     * @param email địa chỉ email của người dùng
     * @return chuỗi OTP 6 số vừa tạo
     */
    String generateOtp(String email);

    /**
     * Kiểm tra tính hợp lệ của mã OTP người dùng nhập vào.
     *
     * @param email địa chỉ email
     * @param otp mã OTP cần xác thực
     * @return true nếu mã OTP khớp và chưa hết hạn
     */
    boolean verifyOtp(String email, String otp);

    /**
     * Xóa mã OTP khỏi bộ nhớ sau khi đã sử dụng thành công.
     *
     * @param email địa chỉ email
     */
    void clearOtp(String email);
}
