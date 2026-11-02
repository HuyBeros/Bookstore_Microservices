package com.bookstore.userservices.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Ngoại lệ nghiệp vụ tùy chỉnh của ứng dụng (Custom Business Exception).
 * Cho phép truyền kèm mã trạng thái HTTP (HttpStatus) để trả về phản hồi tương ứng cho client.
 */
@Getter
public class AppException extends RuntimeException {

    private final HttpStatus status;

    /**
     * Khởi tạo ngoại lệ với thông điệp lỗi và mã trạng thái mặc định là 400 Bad Request.
     *
     * @param message nội dung thông điệp mô tả lỗi
     */
    public AppException(String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
    }

    /**
     * Khởi tạo ngoại lệ với thông điệp lỗi và mã trạng thái HTTP tùy chọn.
     *
     * @param message nội dung thông điệp mô tả lỗi
     * @param status mã trạng thái HTTP tương ứng (ví dụ: 401, 403, 404, 429)
     */
    public AppException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }
}
