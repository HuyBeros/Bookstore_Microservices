package com.bookstore.userservices.service.impl;

import com.bookstore.userservices.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Cài đặt EmailService mô phỏng gửi email thông báo và mã OTP.
 * Ghi log định dạng rõ ràng để hỗ trợ kiểm thử và phát triển nhanh trong môi trường cục bộ.
 */
@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        log.info("=================================================================");
        log.info(">>> GỬI EMAIL XÁC THỰC OTP <<<");
        log.info("Gửi đến: {}", toEmail);
        log.info("Tiêu đề: [StudyMate - BookStore] Mã xác thực khôi phục mật khẩu");
        log.info("Nội dung: Mã OTP của bạn là [ {} ]. Mã có hiệu lực trong vòng 5 phút.", otp);
        log.info("Vui lòng không chia sẻ mã này cho bất kỳ ai.");
        log.info("=================================================================");
    }
}
