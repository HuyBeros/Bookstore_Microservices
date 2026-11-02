package com.example.ai.Service;

import com.example.ai.Dto.*;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class BookBudgetTests {
    @Test void understandsVietnameseMoneyWithoutTreatingBookYearsAsBudget() {
        assertThat(BookBudget.parse("Sách dưới 100k").maximum()).isEqualByComparingTo("99999");
        assertThat(BookBudget.parse("không quá 100.000đ").maximum()).isEqualByComparingTo("100000");
        assertThat(BookBudget.parse("từ 100 đến 200 nghìn").minimum()).isEqualByComparingTo("100000");
        assertThat(BookBudget.parse("từ 100 đến 200 nghìn").maximum()).isEqualByComparingTo("200000");
        assertThat(BookBudget.parse("tối đa 1,5 triệu").maximum()).isEqualByComparingTo("1500000");
        assertThat(BookBudget.parse("Tìm cuốn 1984").maximum()).isNull();
    }
    @Test void keepsBudgetForFollowupsAndHonorsANewBudget() {
        var previous = List.of(new AdviceRequest.Turn(AdviceRequest.Role.USER, "Tiểu thuyết dưới 100k"));
        assertThat(BookBudget.from(new AdviceRequest("Có cuốn khác không?", previous, 3)).maximum()).isEqualByComparingTo("99999");
        assertThat(BookBudget.from(new AdviceRequest("Sách dưới 200k", previous, 3)).maximum()).isEqualByComparingTo("199999");
        var budget = BookBudget.parse("dưới 100k");
        assertThat(budget.accepts(new CatalogBook(1L, "Book", new BigDecimal("100000"), "", null, null, List.of()))).isFalse();
    }
}
