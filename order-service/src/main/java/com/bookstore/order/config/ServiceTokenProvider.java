package com.bookstore.order.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.List;

@Component
public class ServiceTokenProvider {
    private final JwtEncoder encoder;
    private final String issuer;
    private final String audience;
    public ServiceTokenProvider(@Value("${security.jwt.secret}") String secret,
            @Value("${security.jwt.issuer}") String issuer, @Value("${security.jwt.audience}") String audience) {
        this.encoder = new NimbusJwtEncoder(new ImmutableSecret<>(new SecretKeySpec(
                java.util.Base64.getDecoder().decode(secret), "HmacSHA256")));
        this.issuer = issuer;
        this.audience = audience;
    }
    public String token() {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().issuer(issuer).subject("order-service").audience(List.of(audience))
                .issuedAt(now).expiresAt(now.plusSeconds(120)).claim("type", "service")
                .claim("scope", "inventory.write").build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
}
