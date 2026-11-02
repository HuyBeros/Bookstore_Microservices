package com.bookstore.order;

import com.bookstore.order.client.CatalogClient;
import com.bookstore.order.client.InventoryClient;
import com.bookstore.order.entity.Order;
import com.bookstore.order.entity.OrderItem;
import com.bookstore.order.enums.OrderStatus;
import com.bookstore.order.enums.PaymentStatus;
import com.bookstore.order.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BestsellerApiTests {
    @Autowired MockMvc mvc;
    @Autowired OrderRepository orders;
    @Autowired com.bookstore.order.repository.PaymentRepository payments;
    @Autowired com.bookstore.order.repository.OrderStatusEventRepository events;
    @MockBean CatalogClient catalog;
    @MockBean InventoryClient inventory;

    private void clear() { events.deleteAll(); payments.deleteAll(); orders.deleteAll(); }

    private void sale(long bookId, int quantity, OrderStatus status, PaymentStatus payment) {
        Order order = new Order();
        order.setUserId(9876L);
        order.setCustomerName("PRIVATE CUSTOMER");
        order.setShippingAddress("PRIVATE ADDRESS");
        order.setTotalAmount(BigDecimal.valueOf(70000L * quantity));
        order.setOrderStatus(status);
        order.setPaymentStatus(payment);
        OrderItem item = new OrderItem();
        item.setOrder(order); item.setBookId(bookId); item.setBookTitle("Historical title");
        item.setQuantity(quantity); item.setUnitPrice(BigDecimal.valueOf(70000));
        order.getItems().add(item);
        orders.saveAndFlush(order);
    }

    @Test void ranksDeliveredPaidQuantitiesWithoutExposingCustomerData() throws Exception {
        clear();
        sale(11, 3, OrderStatus.DELIVERED, PaymentStatus.PAID);
        sale(22, 2, OrderStatus.DELIVERED, PaymentStatus.PAID);
        sale(22, 2, OrderStatus.DELIVERED, PaymentStatus.PAID);
        sale(33, 3, OrderStatus.DELIVERED, PaymentStatus.PAID);
        sale(44, 99, OrderStatus.CONFIRMED, PaymentStatus.PAID);
        sale(55, 99, OrderStatus.CANCELLED, PaymentStatus.PAID);
        sale(66, 99, OrderStatus.RETURNED, PaymentStatus.PAID);
        sale(77, 99, OrderStatus.DELIVERED, PaymentStatus.UNPAID);
        mvc.perform(get("/api/orders/bestsellers"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.length()").value(3))
            .andExpect(jsonPath("$.data[0].bookId").value(22))
            .andExpect(jsonPath("$.data[0].soldCount").value(4))
            .andExpect(jsonPath("$.data[1].bookId").value(11))
            .andExpect(jsonPath("$.data[2].bookId").value(33))
            .andExpect(jsonPath("$.data[0].userId").doesNotExist())
            .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("PRIVATE"))));
        mvc.perform(get("/api/orders/bestsellers").param("limit", "1"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test void returnsEmptyRatherThanInventingSales() throws Exception {
        clear();
        mvc.perform(get("/api/orders/bestsellers"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data").isEmpty());
    }

    @Test void boundsPublicReadWithoutOpeningPrivateOrderEndpoints() throws Exception {
        mvc.perform(get("/api/orders/bestsellers").param("limit", "0")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/orders/bestsellers").param("limit", "25")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/orders/my")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/stats/overview")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/orders/bestsellers")).andExpect(status().isUnauthorized());
    }
}
