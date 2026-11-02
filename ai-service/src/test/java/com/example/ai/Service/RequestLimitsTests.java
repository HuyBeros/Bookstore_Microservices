package com.example.ai.Service;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;

class RequestLimitsTests {
    @Test void boundsConcurrentCallsAndReleasesCapacity() {
        var limits = new RequestLimits();
        for (int i = 0; i < 8; i++) limits.acquire("user-" + i);
        assertThatThrownBy(() -> limits.acquire("other")).isInstanceOf(ResponseStatusException.class);
        limits.release();
        assertThatCode(() -> limits.acquire("other")).doesNotThrowAnyException();
    }
    @Test void boundsRequestsPerUser() {
        var limits = new RequestLimits();
        for (int i = 0; i < 20; i++) { limits.acquire("alice"); limits.release(); }
        assertThatThrownBy(() -> limits.acquire("alice")).isInstanceOf(ResponseStatusException.class);
        assertThatCode(() -> limits.acquire("bob")).doesNotThrowAnyException();
    }
}
