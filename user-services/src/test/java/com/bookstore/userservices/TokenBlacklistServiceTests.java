package com.bookstore.userservices;

import com.bookstore.userservices.exception.AppException;
import com.bookstore.userservices.service.impl.TokenBlacklistServiceImpl;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TokenBlacklistServiceTests {
    private final StringRedisTemplate redis = mock(StringRedisTemplate.class);
    @SuppressWarnings("unchecked")
    private final ValueOperations<String, String> values = mock(ValueOperations.class);
    private final TokenBlacklistServiceImpl service = new TokenBlacklistServiceImpl(redis);

    @Test
    void logoutStoresRevocationWithOnlyTheRemainingLifetime() {
        when(redis.opsForValue()).thenReturn(values);
        service.blacklistToken("token", 12345);
        verify(values).set("token:blacklist:token", "revoked", Duration.ofMillis(12345));
    }

    @Test
    void redisFailureCannotAcknowledgeGloballySuccessfulLogout() {
        when(redis.opsForValue()).thenThrow(new RedisConnectionFailureException("unavailable"));
        AppException error = assertThrows(AppException.class, () -> service.blacklistToken("token", 12345));
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, error.getStatus());
        // Local fallback still blocks this token on the same auth instance.
        assertTrue(service.isBlacklisted("token"));
    }

    @Test
    void expiredOrMissingTokensDoNotCreateRevocationEntries() {
        service.blacklistToken(null, 100);
        service.blacklistToken("expired", 0);
        verifyNoInteractions(redis);
    }
}
