package com.example.ai.Controller;

import com.example.ai.Dto.ApiResponse;
import com.example.ai.Service.CatalogIndexService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/admin/index")
public class IndexController {
    private final CatalogIndexService index;
    public IndexController(CatalogIndexService index) { this.index = index; }
    @GetMapping("/status")
    public ApiResponse<CatalogIndexService.Status> status() { return ApiResponse.success(index.status()); }
    @PostMapping("/rebuild")
    public ResponseEntity<ApiResponse<CatalogIndexService.Status>> rebuild() {
        Thread.startVirtualThread(index::refresh);
        return ResponseEntity.accepted().body(ApiResponse.success(index.status()));
    }
}
