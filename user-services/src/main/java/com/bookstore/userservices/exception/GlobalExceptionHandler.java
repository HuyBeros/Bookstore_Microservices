package com.bookstore.userservices.exception;

import com.bookstore.userservices.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Lớp xử lý ngoại lệ tập trung trên toàn ứng dụng (Global Exception Handler).
 * Bắt tất cả các loại ngoại lệ phát sinh từ tầng Controller/Service và đóng gói thành cấu trúc ApiResponse đồng nhất.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Bắt và xử lý các ngoại lệ nghiệp vụ tùy chỉnh (AppException).
     *
     * @param ex ngoại lệ AppException chứa thông điệp và HttpStatus tương ứng
     * @return phản hồi ApiResponse kèm mã lỗi HTTP tương ứng
     */
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Object>> handleAppException(AppException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Bắt và xử lý lỗi vi phạm ràng buộc xác thực dữ liệu đầu vào (Validation Errors).
     *
     * @param ex ngoại lệ MethodArgumentNotValidException do @Valid kích hoạt
     * @return phản hồi ApiResponse chứa Map chi tiết các trường bị lỗi kèm mã 400 Bad Request
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        ApiResponse<Map<String, String>> response = ApiResponse.<Map<String, String>>builder()
                .success(false)
                .message("Dữ liệu gửi lên không hợp lệ")
                .data(errors)
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * Bắt và xử lý lỗi sai thông tin đăng nhập từ Spring Security (BadCredentialsException).
     *
     * @param ex ngoại lệ BadCredentialsException
     * @return phản hồi mã 401 Unauthorized với thông điệp chung bảo mật
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadCredentialsException(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Tên đăng nhập hoặc mật khẩu không chính xác"));
    }

    /**
     * Bắt và xử lý lỗi không có quyền truy cập tài nguyên (AccessDeniedException).
     *
     * @param ex ngoại lệ AccessDeniedException do @PreAuthorize hoặc Security kích hoạt
     * @return phản hồi mã 403 Forbidden
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDeniedException(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Bạn không có quyền truy cập chức năng này"));
    }

    /**
     * Bắt tất cả các ngoại lệ không lường trước còn lại của hệ thống (Exception).
     * Log đầy đủ exception ở server-side nhưng chỉ trả về message chung cho client 
     * để tránh lộ thông tin nhạy cảm về cấu trúc hệ thống.
     *
     * @param ex ngoại lệ chung
     * @return phản hồi mã 500 Internal Server Error với message chung
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGenericException(Exception ex) {
        log.error("Lỗi hệ thống không lường trước", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau"));
    }
}
