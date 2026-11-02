package com.example.api_gateway;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TokenRevocationServiceTests {
    private final StringRedisTemplate redis = mock(StringRedisTemplate.class);
    private final TokenRevocationService service = new TokenRevocationService(redis);

    @Test
    void readsTheSameKeyNamespaceWrittenByAuth() {
        when(redis.hasKey("token:blacklist:token")).thenReturn(true, false);
        assertTrue(service.isRevoked("token"));
        assertFalse(service.isRevoked("token"));
        verify(redis, times(2)).hasKey("token:blacklist:token");
    }

    @Test
    void nullAndConnectionFailuresAreNotTreatedAsActiveTokens() {
        when(redis.hasKey("token:blacklist:token")).thenReturn(null);
        assertThrows(DataAccessResourceFailureException.class, () -> service.isRevoked("token"));
        when(redis.hasKey("token:blacklist:token")).thenThrow(new RedisConnectionFailureException("unavailable"));
        assertThrows(RedisConnectionFailureException.class, () -> service.isRevoked("token"));
    }
}
