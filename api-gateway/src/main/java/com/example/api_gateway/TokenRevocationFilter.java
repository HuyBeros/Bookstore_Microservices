package com.example.api_gateway;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

/** Revocation gate only. Each downstream service still validates JWTs and roles. */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10) // CORS must run first, including on 401/503 responses.
public class TokenRevocationFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(TokenRevocationFilter.class);
    private static final Set<String> PUBLIC_AUTH = Set.of(
            "/api/auth/login", "/api/auth/register", "/api/auth/refresh-token",
            "/api/auth/forgot-password", "/api/auth/verify-otp", "/api/auth/reset-password");
    private final TokenRevocationService revocations;
    private final ObjectMapper json;

    public TokenRevocationFilter(TokenRevocationService revocations, ObjectMapper json) {
        this.revocations = revocations;
        this.json = json;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        // A stale Authorization header must not prevent signing in again. These
        // routes validate their own credentials/OTP/refresh token in user-services.
        return "OPTIONS".equals(request.getMethod()) || PUBLIC_AUTH.contains(path);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        var headers = Collections.list(request.getHeaders(HttpHeaders.AUTHORIZATION));
        if (headers.isEmpty()) {
            chain.doFilter(request, response);
            return;
        }
        if (headers.size() != 1) {
            reject(response, 401, "Thông tin xác thực không hợp lệ");
            return;
        }
        String header = headers.getFirst();
        if (!header.regionMatches(true, 0, "Bearer ", 0, 7)) {
            chain.doFilter(request, response);
            return;
        }
        String token = header.substring(7).trim();
        if (token.isEmpty() || token.length() > 8192 || token.indexOf(',') >= 0
                || token.chars().anyMatch(Character::isWhitespace)) {
            reject(response, 401, "Thông tin xác thực không hợp lệ");
            return;
        }
        try {
            if (revocations.isRevoked(token)) {
                reject(response, 401, "Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.");
                return;
            }
        } catch (DataAccessException error) {
            // Never log tokens, Redis keys, credentials or the exception message.
            log.warn("Token revocation check unavailable ({})", error.getClass().getSimpleName());
            reject(response, 503, "Chưa thể kiểm tra phiên đăng nhập. Vui lòng thử lại sau.");
            return;
        }
        chain.doFilter(request, response);
    }

    private void reject(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setCharacterEncoding("UTF-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        if (status == 401) response.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Bearer");
        if (status == 503) response.setHeader(HttpHeaders.RETRY_AFTER, "2");
        json.writeValue(response.getWriter(), ApiResponse.error(message));
    }
}
