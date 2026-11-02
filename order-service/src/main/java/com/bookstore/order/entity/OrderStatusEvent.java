package com.bookstore.order.entity;

import com.bookstore.order.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_status_events")
@Getter
@NoArgsConstructor
public class OrderStatusEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false) private Long orderId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private OrderStatus status;
    @Column(nullable = false) private LocalDateTime createdAt;
    public OrderStatusEvent(Long orderId, OrderStatus status) {
        this.orderId = orderId;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }
}
