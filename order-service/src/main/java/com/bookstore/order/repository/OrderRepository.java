package com.bookstore.order.repository;

import com.bookstore.order.entity.Order;
import com.bookstore.order.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    @org.springframework.data.jpa.repository.Query("""
        select new com.bookstore.order.dto.BestsellerResponse(i.bookId, sum(i.quantity))
        from OrderItem i join i.order o
        where o.orderStatus = :status and o.paymentStatus = :payment
        group by i.bookId
        order by sum(i.quantity) desc, i.bookId asc
        """)
    List<com.bookstore.order.dto.BestsellerResponse> bestsellers(
            @org.springframework.data.repository.query.Param("status") OrderStatus status,
            @org.springframework.data.repository.query.Param("payment") com.bookstore.order.enums.PaymentStatus payment,
            org.springframework.data.domain.Pageable pageable);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select o from Order o where o.id = :id")
    java.util.Optional<Order> findForUpdate(@org.springframework.data.repository.query.Param("id") Long id);
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Order> findByOrderStatusOrderByCreatedAtDesc(OrderStatus status);
    List<Order> findAllByOrderByCreatedAtDesc();
}
