package com.bookstore.userservices;

import com.bookstore.userservices.security.JwtService;
import com.bookstore.userservices.entity.*;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.assertj.core.api.Assertions.*;

class JwtContractTests {
    @Test void publishesSharedAccessTokenClaimsAndDistinctRefreshTokens() {
        var service = new JwtService();
        ReflectionTestUtils.setField(service, "secretKey", "MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=");
        ReflectionTestUtils.setField(service, "issuer", "http://localhost:8081");
        ReflectionTestUtils.setField(service, "audience", "bookstore");
        ReflectionTestUtils.setField(service, "jwtExpiration", 60000L);
        ReflectionTestUtils.setField(service, "refreshExpiration", 120000L);
        service.validateSecretKey();
        var user = User.builder().userId(42L).username("alice")
                .role(Role.builder().roleName(RoleName.CUSTOMER).build()).build();
        String access = service.generateToken(user);
        assertThat(service.extractUsername(access)).isEqualTo("alice");
        assertThat((Object) service.extractClaim(access, claims -> claims.get("userId", Long.class))).isEqualTo(42L);
        assertThat((Object) service.extractClaim(access, claims -> claims.get("roles"))).isEqualTo(java.util.List.of("CUSTOMER"));
        assertThat((Object) service.extractClaim(access, claims -> claims.getIssuer())).isEqualTo("http://localhost:8081");
        assertThat((Object) service.extractClaim(access, claims -> claims.getAudience())).isEqualTo(java.util.Set.of("bookstore"));
        String refresh = service.generateRefreshToken(user);
        assertThat(service.isRefreshTokenValid(refresh, user)).isTrue();
        assertThat(service.isRefreshTokenValid(access, user)).isFalse();
    }
}
