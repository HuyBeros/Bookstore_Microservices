package com.bookstore.userservices.dto.response;

import lombok.*;

import java.io.Serializable;
import java.util.List;

/**
 * Cấu trúc đóng gói dữ liệu phân trang chuẩn hóa cho toàn hệ thống.
 * Chứa danh sách đối tượng của trang hiện tại kèm các metadata: số trang, kích thước, tổng số bản ghi.
 *
 * @param <T> kiểu dữ liệu của phần tử trong trang
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PageResponse<T> implements Serializable {

    private int pageNo;
    private int pageSize;
    private int totalPages;
    private long totalElements;
    private boolean last;
    private List<T> items;
}
