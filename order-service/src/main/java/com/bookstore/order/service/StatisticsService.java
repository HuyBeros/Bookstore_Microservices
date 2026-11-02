package com.bookstore.order.service;

import com.bookstore.order.entity.Order;
import com.bookstore.order.enums.OrderStatus;
import com.bookstore.order.enums.PaymentStatus;
import com.bookstore.order.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StatisticsService {
    private final OrderRepository orders;
    @Transactional(readOnly = true)
    public List<com.bookstore.order.dto.BestsellerResponse> bestsellers(int limit) {
        return orders.bestsellers(OrderStatus.DELIVERED, PaymentStatus.PAID,
                org.springframework.data.domain.PageRequest.of(0, limit));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> overview() {
        List<Order> all = orders.findAllByOrderByCreatedAtDesc();
        List<Order> paid = all.stream().filter(o -> o.getPaymentStatus() == PaymentStatus.PAID
                && o.getOrderStatus() != OrderStatus.CANCELLED && o.getOrderStatus() != OrderStatus.RETURNED).toList();
        BigDecimal revenue = paid.stream().map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        LocalDate month = LocalDate.now().withDayOfMonth(1);
        BigDecimal monthly = paid.stream().filter(o -> !o.getCreatedAt().toLocalDate().isBefore(month))
                .map(Order::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, BigDecimal> daily = new TreeMap<>();
        Map<Long, Map<String, Object>> books = new LinkedHashMap<>();
        int sold = 0;
        for (Order order : paid) {
            daily.merge(order.getCreatedAt().toLocalDate().toString(), order.getTotalAmount(), BigDecimal::add);
            for (var item : order.getItems()) {
                sold += item.getQuantity();
                var book = books.computeIfAbsent(item.getBookId(), id -> new LinkedHashMap<>(Map.of(
                        "bookId", id, "name", item.getBookTitle(), "title", item.getBookTitle(),
                        "soldCount", 0, "revenue", BigDecimal.ZERO)));
                book.put("soldCount", (int) book.get("soldCount") + item.getQuantity());
                book.put("revenue", ((BigDecimal) book.get("revenue")).add(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()))));
            }
        }
        var top = books.values().stream().sorted(Comparator.comparingInt((Map<String, Object> book) -> (int) book.get("soldCount")).reversed()).limit(10).toList();
        var days = daily.entrySet().stream().map(e -> Map.of("date", e.getKey(), "amount", e.getValue())).toList();
        var statuses = Arrays.stream(OrderStatus.values()).map(status -> Map.of("status", status.name(),
                "count", all.stream().filter(o -> o.getOrderStatus() == status).count())).toList();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalRevenue", revenue);
        result.put("totalOrders", all.size());
        result.put("totalProductsSold", sold);
        result.put("revenueData", days);
        result.put("ordersData", statuses);
        result.put("topProducts", top);
        result.put("monthly_revenue", monthly);
        result.put("pending_orders_count", all.stream().filter(o -> o.getOrderStatus() == OrderStatus.PENDING).count());
        result.put("new_orders_count", all.stream().filter(o -> !o.getCreatedAt().toLocalDate().isBefore(month)).count());
        result.put("revenue_data", days);
        return result;
    }
}
