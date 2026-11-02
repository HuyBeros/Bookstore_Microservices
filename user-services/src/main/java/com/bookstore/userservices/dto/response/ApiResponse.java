package com.bookstore.userservices.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Lớp vỏ bọc phản hồi API chuẩn hóa toàn hệ thống (Generic API Response Wrapper).
 * Cấu trúc gồm: trạng thái thành công (success), thông điệp (message), dữ liệu trả về (data), và thời gian (timestamp).
 *
 * @param <T> kiểu dữ liệu của đối tượng phản hồi trong payload
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    @Builder.Default
    private boolean success = true;

    private String message;

    private T data;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * Tạo phản hồi thành công kèm dữ liệu và thông điệp tùy chọn.
     *
     * @param data dữ liệu payload trả về
     * @param message thông điệp mô tả
     * @param <T> kiểu dữ liệu của payload
     * @return đối tượng ApiResponse hoàn chỉnh
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Tạo phản hồi thành công kèm dữ liệu với thông điệp mặc định "Thành công".
     */
    public static <T> ApiResponse<T> success(T data) {
        return success(data, "Thành công");
    }

    /**
     * Tạo phản hồi báo lỗi kèm thông điệp chi tiết.
     *
     * @param message thông điệp lỗi
     * @param <T> kiểu dữ liệu
     * @return đối tượng ApiResponse biểu diễn lỗi
     */
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
