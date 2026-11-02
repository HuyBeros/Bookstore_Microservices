package com.bookstore.userservices.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Lớp cấu hình giới hạn tần suất gọi API (Rate Limiting) sử dụng thuật toán Token Bucket của Bucket4j.
 * Cấu hình dung lượng bucket và chu kỳ nạp lại token từ file application.properties.
 */
@Configuration
public class RateLimitConfig {

    @Value("${rate.limit.login.capacity:5}")
    private int loginCapacity;

    @Value("${rate.limit.login.refill-tokens:5}")
    private int loginRefillTokens;

    @Value("${rate.limit.login.refill-duration-minutes:15}")
    private int loginRefillDurationMinutes;

    /**
     * Bean lưu trữ các Bucket của từng định danh người dùng trong bộ nhớ tạm (ConcurrentHashMap).
     *
     * @return Map lưu trữ định danh và Bucket tương ứng
     */
    @Bean
    public Map<String, Bucket> rateLimitBuckets() {
        return new ConcurrentHashMap<>();
    }

    /**
     * Tạo mới một đối tượng Bucket với cấu hình giới hạn cho chức năng đăng nhập.
     *
     * @return đối tượng Bucket của Bucket4j
     */
    public Bucket createLoginBucket() {
        Bandwidth limit = Bandwidth.classic(
                loginCapacity,
                Refill.intervally(loginRefillTokens, Duration.ofMinutes(loginRefillDurationMinutes))
        );
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}
