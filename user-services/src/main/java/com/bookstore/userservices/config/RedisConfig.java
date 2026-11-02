package com.bookstore.userservices.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;

/**
 * Cấu hình Redis và Spring Cache cho user-services.
 * Hỗ trợ lưu trữ phân tán (Token Blacklist, OTP, Rate Limiting) và bộ nhớ đệm (User Profiles).
 * Tích hợp CacheErrorHandler giúp ứng dụng tự phục hồi (graceful degradation) nếu Redis tạm thời mất kết nối.
 * 
 * Sử dụng RedisSerializer.json() thay vì GenericJackson2JsonRedisSerializer (deprecated).
 */
@Configuration
@EnableCaching
@Slf4j
public class RedisConfig implements CachingConfigurer {

    /**
     * Cấu hình RedisTemplate chuẩn hóa với String key và JSON value serializer.
     * Sử dụng RedisSerializer.json() (recommended approach) thay vì GenericJackson2JsonRedisSerializer.
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Sử dụng RedisSerializer.json() - approach được khuyến nghị
        RedisSerializer<Object> jsonSerializer = RedisSerializer.json();
        StringRedisSerializer stringSerializer = new StringRedisSerializer();

        template.setKeySerializer(stringSerializer);
        template.setValueSerializer(jsonSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setHashValueSerializer(jsonSerializer);
        template.afterPropertiesSet();

        return template;
    }

    /**
     * Cấu hình Redis Cache Manager với TTL mặc định 30 phút.
     * Sử dụng RedisSerializer.json() thay vì GenericJackson2JsonRedisSerializer.
     */
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisSerializer<Object> jsonSerializer = RedisSerializer.json();

        RedisCacheConfiguration cacheConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(cacheConfig)
                .build();
    }

    /**
     * Xử lý lỗi ngoại lệ khi truy xuất bộ đệm Redis.
     * Khi Redis gặp sự cố, hệ thống tự động fallback truy vấn CSDL thay vì crash toàn bộ request.
     */
    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Lỗi đọc cache Redis [name: {}, key: {}]: {}. Đang fallback về CSDL.",
                        cache != null ? cache.getName() : "unknown", key, exception.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
                log.warn("Lỗi ghi cache Redis [name: {}, key: {}]: {}",
                        cache != null ? cache.getName() : "unknown", key, exception.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Lỗi xóa cache Redis [name: {}, key: {}]: {}",
                        cache != null ? cache.getName() : "unknown", key, exception.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.warn("Lỗi dọn sạch cache Redis [name: {}]: {}",
                        cache != null ? cache.getName() : "unknown", exception.getMessage());
            }
        };
    }
}
