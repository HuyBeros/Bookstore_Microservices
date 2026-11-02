package com.bookstore.userservices.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Bộ lọc kiểm tra và giải mã JWT token trên mỗi request (OncePerRequestFilter).
 * Nếu token hợp lệ, nạp thông tin UserDetails và phân quyền vào SecurityContextHolder của luồng hiện tại.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String AUTH_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final com.bookstore.userservices.service.TokenBlacklistService tokenBlacklistService;

    /**
     * Thực thi lọc request đến: kiểm tra Header Authorization, xác thực token và thiết lập SecurityContext.
     */
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader(AUTH_HEADER);

        // Bỏ qua nếu request không có header Authorization hoặc không bắt đầu bằng "Bearer "
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(BEARER_PREFIX.length());

        // Kiểm tra nếu token đã bị thu hồi/đăng xuất (nằm trong Redis Blacklist)
        if (tokenBlacklistService.isBlacklisted(jwt)) {
            logger.warn("Token đã nằm trong danh sách đen (Blacklisted)");
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String username = jwtService.extractUsername(jwt);

            // Kiểm tra username hợp lệ và SecurityContext chưa có xác thực
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // Dùng createEmptyContext() để đảm bảo an toàn đa luồng (tránh race condition)
                    var context = SecurityContextHolder.createEmptyContext();
                    context.setAuthentication(authToken);
                    SecurityContextHolder.setContext(context);
                }
            }
        } catch (io.jsonwebtoken.JwtException | IllegalArgumentException e) {
            // Token không hợp lệ hoặc hết hạn -> ghi log cảnh báo và tiếp tục chuỗi lọc mà không cấp quyền
            logger.warn("Không thể xác thực JWT Token: " + e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
