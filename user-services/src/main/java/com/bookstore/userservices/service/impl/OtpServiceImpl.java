package com.bookstore.userservices.service.impl;

import com.bookstore.userservices.service.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Cài đặt OtpService lưu trữ phân tán trên Redis với thời hạn TTL tự hủy.
 * Tích hợp bộ nhớ dự phòng In-Memory để đảm bảo hoạt động thông suốt.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OtpServiceImpl implements OtpService {

    private static final String OTP_KEY_PREFIX = "otp:reset_password:";
    private final SecureRandom secureRandom = new SecureRandom();

    private final StringRedisTemplate stringRedisTemplate;

    @Value("${application.security.otp.expiration-minutes:5}")
    private long otpExpirationMinutes;

    // Bộ nhớ nội bộ dự phòng nếu kết nối Redis gặp sự cố
    private final Map<String, OtpEntry> localFallbackOtp = new ConcurrentHashMap<>();

    private record OtpEntry(String otp, long expiryTimeMs) {}

    @Override
    public String generateOtp(String email) {
        // Business Rule: Email không được null hoặc rỗng
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email không được để trống");
        }
        
        String normalizedEmail = email.trim().toLowerCase();
        int randomCode = secureRandom.nextInt(900000) + 100000;
        String otp = String.valueOf(randomCode);

        String key = OTP_KEY_PREFIX + normalizedEmail;
        Duration ttl = Duration.ofMinutes(otpExpirationMinutes);

        try {
            stringRedisTemplate.opsForValue().set(key, otp, ttl);
            log.info("Đã tạo và lưu mã OTP vào Redis cho [{}], TTL: {} phút", normalizedEmail, otpExpirationMinutes);
        } catch (Exception e) {
            log.warn("Không thể lưu OTP vào Redis, kích hoạt fallback bộ nhớ cục bộ: {}", e.getMessage());
            long expiryTime = System.currentTimeMillis() + ttl.toMillis();
            localFallbackOtp.put(normalizedEmail, new OtpEntry(otp, expiryTime));
        }

        return otp;
    }

    @Override
    public boolean verifyOtp(String email, String otp) {
        if (email == null || otp == null) {
            return false;
        }

        String normalizedEmail = email.trim().toLowerCase();
        String key = OTP_KEY_PREFIX + normalizedEmail;

        try {
            String storedOtp = stringRedisTemplate.opsForValue().get(key);
            if (storedOtp != null && storedOtp.equals(otp.trim())) {
                return true;
            }
        } catch (Exception e) {
            log.warn("Lỗi đọc OTP từ Redis, kiểm tra bộ nhớ dự phòng: {}", e.getMessage());
        }

        OtpEntry entry = localFallbackOtp.get(normalizedEmail);
        if (entry != null) {
            if (System.currentTimeMillis() <= entry.expiryTimeMs()) {
                return entry.otp().equals(otp.trim());
            } else {
                localFallbackOtp.remove(normalizedEmail);
            }
        }

        return false;
    }

    @Override
    public void clearOtp(String email) {
        if (email == null) {
            return;
        }

        String normalizedEmail = email.trim().toLowerCase();
        String key = OTP_KEY_PREFIX + normalizedEmail;

        try {
            stringRedisTemplate.delete(key);
        } catch (Exception e) {
            log.warn("Lỗi xóa OTP từ Redis: {}", e.getMessage());
        }

        localFallbackOtp.remove(normalizedEmail);
    }
}
