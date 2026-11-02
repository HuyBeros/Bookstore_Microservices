package com.bookstore.userservices.security;

import com.bookstore.userservices.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Dịch vụ xử lý mã hóa, giải mã và xác thực JSON Web Token (JWT).
 * Hỗ trợ tạo Access Token (ngắn hạn) và Refresh Token (dài hạn) với thuật toán HMAC-SHA256.
 */
@Service
public class JwtService {

    public static final String CLAIM_USER_ID = "userId";
    public static final String CLAIM_ROLE = "role";
    public static final String CLAIM_TYPE = "type";
    public static final String TOKEN_TYPE_ACCESS = "access";
    public static final String TOKEN_TYPE_REFRESH = "refresh";

    @Value("${application.security.jwt.secret-key}")
    private String secretKey;

    @Value("${JWT_ISSUER:http://localhost:8081}")
    private String issuer;
    @Value("${JWT_AUDIENCE:bookstore}")
    private String audience;

    @Value("${application.security.jwt.expiration}")
    private long jwtExpiration;

    @Value("${application.security.jwt.refresh-expiration}")
    private long refreshExpiration;

    /**
     * Xác thực độ dài tối thiểu của JWT secret key khi khởi động ứng dụng.
     * Secret key phải có độ dài tối thiểu 256 bits (32 bytes) sau khi decode Base64 
     * để đảm bảo độ an toàn với thuật toán HMAC-SHA256.
     *
     * @throws IllegalStateException nếu secret key null, rỗng hoặc quá ngắn
     */
    @PostConstruct
    public void validateSecretKey() {
        if (secretKey == null || secretKey.isEmpty()) {
            throw new IllegalStateException("JWT_SECRET không được để trống");
        }
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                "JWT_SECRET phải có độ dài tối thiểu 256 bits (32 bytes) sau khi decode Base64. " +
                "Hiện tại chỉ có " + (keyBytes.length * 8) + " bits."
            );
        }
    }

    /**
     * Trích xuất tên đăng nhập (Subject) từ chuỗi token.
     *
     * @param token chuỗi JWT token
     * @return username lưu trong token
     */
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Trích xuất một thông tin bất kỳ (Claim) từ token bằng hàm giải mã Resolver.
     *
     * @param token chuỗi JWT token
     * @param claimsResolver hàm xử lý claim
     * @param <T> kiểu dữ liệu trả về
     * @return giá trị claim tương ứng
     */
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    /**
     * Tạo mới Access Token (loại token dùng để gọi API bảo mật) có thời hạn ngắn.
     *
     * @param user đối tượng người dùng sở hữu token
     * @return chuỗi Access Token JWT
     */
    public String generateToken(User user) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put(CLAIM_USER_ID, user.getUserId());
        extraClaims.put(CLAIM_ROLE, user.getRole().getRoleName().name());
        extraClaims.put("roles", java.util.List.of(user.getRole().getRoleName().name()));
        extraClaims.put(CLAIM_TYPE, TOKEN_TYPE_ACCESS);
        return buildToken(extraClaims, user.getUsername(), jwtExpiration);
    }

    /**
     * Tạo mới Refresh Token (dùng để cấp lại Access Token) có thời hạn dài.
     *
     * @param user đối tượng người dùng sở hữu token
     * @return chuỗi Refresh Token JWT
     */
    public String generateRefreshToken(User user) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put(CLAIM_USER_ID, user.getUserId());
        extraClaims.put(CLAIM_TYPE, TOKEN_TYPE_REFRESH);
        return buildToken(extraClaims, user.getUsername(), refreshExpiration);
    }

    /**
     * Xây dựng và ký chuỗi token hoàn chỉnh với các claims tùy biến.
     */
    private String buildToken(Map<String, Object> extraClaims, String username, long expiration) {
        return Jwts.builder()
                .id(java.util.UUID.randomUUID().toString())
                .claims(extraClaims)
                .subject(username)
                .issuer(issuer)
                .audience().add(audience).and()
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey(), Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Xác thực tính hợp lệ của Access Token đối với thông tin UserDetails trong SecurityContext.
     *
     * @param token chuỗi Access Token cần kiểm tra
     * @param userDetails thông tin người dùng được nạp từ hệ thống
     * @return true nếu token hợp lệ, chưa hết hạn và đúng loại access token
     */
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        String tokenType = extractClaim(token, claims -> claims.get(CLAIM_TYPE, String.class));
        return (username != null && username.equals(userDetails.getUsername()))
                && !isTokenExpired(token)
                && TOKEN_TYPE_ACCESS.equals(tokenType);
    }

    /**
     * Xác thực tính hợp lệ của Refresh Token đối với đối tượng User.
     *
     * @param token chuỗi Refresh Token cần kiểm tra
     * @param user đối tượng người dùng
     * @return true nếu token hợp lệ, chưa hết hạn và đúng loại refresh token
     */
    public boolean isRefreshTokenValid(String token, User user) {
        final String username = extractUsername(token);
        String tokenType = extractClaim(token, claims -> claims.get(CLAIM_TYPE, String.class));
        return (username != null && username.equals(user.getUsername()))
                && !isTokenExpired(token)
                && TOKEN_TYPE_REFRESH.equals(tokenType);
    }

    /**
     * Kiểm tra token đã hết hạn sử dụng hay chưa.
     */
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    /**
     * Lấy ngày giờ hết hạn của token.
     */
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    /**
     * Tính thời gian còn lại (tính bằng mili-giây) trước khi token hết hạn.
     * Dùng để thiết lập TTL chính xác khi đưa token vào Redis Blacklist.
     */
    public long getRemainingExpiration(String token) {
        Date expiration = extractExpiration(token);
        long remaining = expiration.getTime() - System.currentTimeMillis();
        return Math.max(0, remaining);
    }

    /**
     * Giải mã toàn bộ payload Claims từ token đã được ký.
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignInKey())
                .requireIssuer(issuer)
                .requireAudience(audience)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Tạo SecretKey mật mã từ chuỗi bí mật secretKey đã được mã hóa Base64.
     */
    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
