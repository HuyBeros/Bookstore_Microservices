package com.bookstore.userservices;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

/** In-memory dependencies for tests; no connection to the developer's PostgreSQL or Redis. */
@TestConfiguration
public class TestInfrastructure {
    @Bean @Primary CacheManager testCacheManager() { return new ConcurrentMapCacheManager(); }
    @Bean @Primary StringRedisTemplate testRedisTemplate() {
        var template = mock(StringRedisTemplate.class);
        @SuppressWarnings("unchecked")
        ValueOperations<String, String> values = mock(ValueOperations.class);
        record Entry(String value, long expiresAt) {}
        Map<String, Entry> entries = new ConcurrentHashMap<>();
        when(template.opsForValue()).thenReturn(values);
        doAnswer(call -> {
            entries.put(call.getArgument(0), new Entry(call.getArgument(1),
                    System.currentTimeMillis() + ((Duration) call.getArgument(2)).toMillis()));
            return null;
        }).when(values).set(anyString(), anyString(), any(Duration.class));
        when(values.get(anyString())).thenAnswer(call -> {
            Entry entry = entries.get(call.getArgument(0));
            return entry != null && entry.expiresAt() > System.currentTimeMillis() ? entry.value() : null;
        });
        when(template.hasKey(anyString())).thenAnswer(call -> values.get(call.getArgument(0)) != null);
        when(template.delete(anyString())).thenAnswer(call -> entries.remove(call.getArgument(0)) != null);
        return template;
    }
}
