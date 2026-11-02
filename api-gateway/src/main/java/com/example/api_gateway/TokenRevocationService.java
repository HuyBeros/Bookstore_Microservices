package com.example.api_gateway;

import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class TokenRevocationService {
    // Matches the keys written by user-services. Never cache a negative lookup:
    // a token may be revoked immediately after its previous request.
    private static final String PREFIX = "token:blacklist:";
    private final StringRedisTemplate redis;

    public TokenRevocationService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public boolean isRevoked(String token) {
        Boolean revoked = redis.hasKey(PREFIX + token);
        if (revoked == null) {
            throw new DataAccessResourceFailureException("Token revocation lookup returned no result");
        }
        return revoked;
    }
}
