package com.bookstore.order.config;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

public final class CurrentUser {
    private CurrentUser() {}
    public static Long id(Jwt jwt) {
        Object value = jwt.getClaims().get("userId");
        if (!(value instanceof Number number) || number.longValue() <= 0) throw new AccessDeniedException("Missing user identity");
        return number.longValue();
    }
    public static boolean manager(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_STAFF"));
    }
}
