package com.example.api_gateway;

import jakarta.servlet.FilterChain;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.filter.CorsFilter;
import tools.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TokenRevocationFilterTests {
    private final TokenRevocationService service = mock(TokenRevocationService.class);
    private final ObjectMapper json = new ObjectMapper();
    private final TokenRevocationFilter filter = new TokenRevocationFilter(service, json);

    private MockHttpServletRequest request(String method, String path, String token) {
        var request = new MockHttpServletRequest(method, path);
        if (token != null) request.addHeader(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        return request;
    }

    @Test
    void revokedTokenCannotReachAnyDownstreamService() throws Exception {
        when(service.isRevoked("revoked")).thenReturn(true);
        for (String path : new String[]{"/api/users/profile", "/api/orders/my", "/api/cart",
                "/api/inventory/transactions", "/api/catalog/books", "/api/stats/overview", "/api/ai/chat"}) {
            var response = new MockHttpServletResponse();
            var forwarded = new AtomicBoolean();
            filter.doFilter(request("GET", path, "revoked"), response, (req, res) -> forwarded.set(true));
            assertFalse(forwarded.get(), path);
            assertEquals(401, response.getStatus(), path);
            assertFalse(json.readTree(response.getContentAsString()).path("success").asBoolean());
            assertEquals("Bearer", response.getHeader(HttpHeaders.WWW_AUTHENTICATE));
        }
    }

    @Test
    void activeTokenIsForwardedAndRecheckedAfterLogout() throws Exception {
        when(service.isRevoked("same-token")).thenReturn(false, true);
        var first = new AtomicBoolean();
        filter.doFilter(request("GET", "/api/orders/my", "same-token"), new MockHttpServletResponse(),
                (req, res) -> first.set(true));
        assertTrue(first.get());
        var second = new MockHttpServletResponse();
        filter.doFilter(request("GET", "/api/orders/my", "same-token"), second,
                (req, res) -> fail("Revoked token was forwarded"));
        assertEquals(401, second.getStatus());
        verify(service, times(2)).isRevoked("same-token");
    }

    @Test
    void redisOutageDoesNotSilentlyAuthorizeToken() throws Exception {
        when(service.isRevoked("active")).thenThrow(new RedisConnectionFailureException("private details"));
        var response = new MockHttpServletResponse();
        filter.doFilter(request("GET", "/api/orders/my", "active"), response,
                (req, res) -> fail("Cannot forward without revocation verification"));
        assertEquals(503, response.getStatus());
        assertEquals("2", response.getHeader(HttpHeaders.RETRY_AFTER));
        assertEquals("no-store", response.getHeader(HttpHeaders.CACHE_CONTROL));
        assertFalse(response.getContentAsString().contains("private details"));
    }

    @Test
    void anonymousRequestsRetainExistingDownstreamAccessRules() throws Exception {
        for (String path : new String[]{"/api/catalog/books", "/api/orders/my", "/actuator/health"}) {
            var forwarded = new AtomicBoolean();
            filter.doFilter(request("GET", path, null), new MockHttpServletResponse(), (req, res) -> forwarded.set(true));
            assertTrue(forwarded.get());
        }
        verifyNoInteractions(service);
    }

    @Test
    void staleAuthorizationCannotPreventSigningInAgain() throws Exception {
        for (String path : new String[]{"/api/auth/login", "/api/auth/register", "/api/auth/refresh-token",
                "/api/auth/forgot-password", "/api/auth/verify-otp", "/api/auth/reset-password"}) {
            var forwarded = new AtomicBoolean();
            filter.doFilter(request("POST", path, "stale"), new MockHttpServletResponse(), (req, res) -> forwarded.set(true));
            assertTrue(forwarded.get(), path);
        }
        verifyNoInteractions(service);
    }

    @Test
    void logoutIsCheckedAndOptionsDoNotRequireRedis() throws Exception {
        when(service.isRevoked("revoked")).thenReturn(true);
        var logout = new MockHttpServletResponse();
        filter.doFilter(request("POST", "/api/auth/logout", "revoked"), logout, (req, res) -> fail());
        assertEquals(401, logout.getStatus());
        var forwarded = new AtomicBoolean();
        filter.doFilter(request("OPTIONS", "/api/orders/my", "revoked"), new MockHttpServletResponse(),
                (req, res) -> forwarded.set(true));
        assertTrue(forwarded.get());
        verify(service, times(1)).isRevoked("revoked");
    }

    @Test
    void bearerSchemeCaseAndSurroundingSpacesDoNotBypassBlacklist() throws Exception {
        when(service.isRevoked("revoked")).thenReturn(true);
        var request = request("GET", "/api/orders/my", null);
        request.addHeader(HttpHeaders.AUTHORIZATION, "bearer   revoked  ");
        var response = new MockHttpServletResponse();
        filter.doFilter(request, response, (req, res) -> fail());
        assertEquals(401, response.getStatus());
    }

    @Test
    void ambiguousOrEmptyBearerHeadersAreRejected() throws Exception {
        for (String header : new String[]{"Bearer ", "Bearer token other", "Bearer first,Bearer second"}) {
            var request = request("GET", "/api/orders/my", null);
            request.addHeader(HttpHeaders.AUTHORIZATION, header);
            var response = new MockHttpServletResponse();
            filter.doFilter(request, response, (req, res) -> fail());
            assertEquals(401, response.getStatus());
        }
        var duplicate = request("GET", "/api/orders/my", "one");
        duplicate.addHeader(HttpHeaders.AUTHORIZATION, "Bearer two");
        var response = new MockHttpServletResponse();
        filter.doFilter(duplicate, response, (req, res) -> fail());
        assertEquals(401, response.getStatus());
        verifyNoInteractions(service);
    }

    @Test
    void rejectionIncludesCorsHeadersSoBrowserCanReadItsMessage() throws Exception {
        when(service.isRevoked("revoked")).thenReturn(true);
        CorsFilter cors = new CorsConfig().corsFilter().getFilter();
        var request = request("GET", "/api/orders/my", "revoked");
        request.setServerPort(8080);
        request.addHeader(HttpHeaders.ORIGIN, "http://localhost:5173");
        var response = new MockHttpServletResponse();
        FilterChain downstream = (req, res) -> fail();
        cors.doFilter(request, response, (req, res) -> filter.doFilter(req, res, downstream));
        assertEquals(401, response.getStatus());
        assertEquals("http://localhost:5173", response.getHeader(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }
}
