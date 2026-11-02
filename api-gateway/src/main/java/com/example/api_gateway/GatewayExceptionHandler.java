package com.example.api_gateway;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import java.util.Map;

@RestControllerAdvice
public class GatewayExceptionHandler {
    @ExceptionHandler(HttpServerErrorException.class)
    public ResponseEntity<Map<String, Object>> downstream(HttpServerErrorException error) {
        return ResponseEntity.status(error.getStatusCode()).body(Map.of(
                "success", false, "message", "Dịch vụ tạm thời chưa sẵn sàng, vui lòng thử lại"));
    }

    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<Map<String, Object>> unavailable(ResourceAccessException error) {
        return ResponseEntity.status(503).body(Map.of(
                "success", false, "message", "Không kết nối được dịch vụ phía sau gateway"));
    }
}
