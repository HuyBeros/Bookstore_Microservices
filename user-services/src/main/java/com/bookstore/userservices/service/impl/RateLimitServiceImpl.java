package com.bookstore.userservices.service.impl;

import com.bookstore.userservices.config.RateLimitConfig;
import com.bookstore.userservices.service.RateLimitService;
import io.github.bucket4j.Bucket;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Lớp cài đặt dịch vụ kiểm soát tần suất truy cập sử dụng thư viện Bucket4j.
 * Quản lý các Bucket trong bộ nhớ tạm (in-memory) để kiểm tra số lượt gọi API trên từng tài khoản.
 */
@Service
@RequiredArgsConstructor
public class RateLimitServiceImpl implements RateLimitService {

    private static final String LOGIN_BUCKET_PREFIX = "login:";

    private final Map<String, Bucket> rateLimitBuckets;
    private final RateLimitConfig rateLimitConfig;

    /**
     * Kiểm tra và tiêu thụ 1 token đăng nhập cho tài khoản.
     * 
     * Business Rule: Mỗi username/email chỉ được thử đăng nhập tối đa N lần trong M phút
     *
     * @param identifier định danh người dùng (username hoặc email)
     * @return true nếu còn lượt đăng nhập, false nếu đã dùng hết hạn mức hoặc identifier không hợp lệ
     */
    @Override
    public boolean tryConsumeLogin(String identifier) {
        // Business Rule: Identifier không được null hoặc rỗng
        if (identifier == null || identifier.isEmpty()) {
            return false;
        }
        
        Bucket bucket = rateLimitBuckets.computeIfAbsent(
                LOGIN_BUCKET_PREFIX + identifier,
                k -> rateLimitConfig.createLoginBucket()
        );
        return bucket.tryConsume(1);
    }

    /**
     * Xóa bỏ giới hạn đăng nhập của tài khoản khi đăng nhập thành công.
     *
     * @param identifier định danh người dùng
     */
    @Override
    public void resetLoginLimit(String identifier) {
        rateLimitBuckets.remove(LOGIN_BUCKET_PREFIX + identifier);
    }
}
