package com.example.ai.Controller;

import com.example.ai.Dto.AdminBriefing;
import com.example.ai.Dto.ApiResponse;
import com.example.ai.Service.AdminBriefingService;
import com.example.ai.Service.RequestLimits;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdminBriefingController {
    private final AdminBriefingService briefing;
    private final RequestLimits limits;

    public AdminBriefingController(AdminBriefingService briefing, RequestLimits limits) {
        this.briefing = briefing;
        this.limits = limits;
    }

    @PostMapping("/api/ai/admin/briefing")
    public ApiResponse<AdminBriefing> briefing(@AuthenticationPrincipal Jwt jwt) {
        limits.acquire(jwt.getSubject());
        try {
            return ApiResponse.success(briefing.create(jwt.getTokenValue()));
        } finally {
            limits.release();
        }
    }
}
