package com.example.ai.Service;

import com.example.ai.Dto.*;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class BookGenreTests {
    private CatalogBook book(String category) {
        return new CatalogBook(1L, "Book", BigDecimal.TEN, "Tiểu thuyết về cuộc sống.", new CatalogBook.Reference(1L, category), null, List.of());
    }
    @Test void novelRequestCannotIncludePhilosophyOrTechnology() {
        var genre = BookGenre.from(new AdviceRequest("Tìm tiểu thuyết dưới 100k. Không gợi ý sách công nghệ.", List.of(), 3));
        assertThat(genre.accepts(book("Văn học hiện đại"))).isTrue();
        assertThat(genre.accepts(book("Triết học & Tư tưởng"))).isFalse();
        assertThat(genre.accepts(book("Công nghệ & Trí tuệ nhân tạo"))).isFalse();
    }
    @Test void followsExplicitChangeOfTopicAndRespectsNegation() {
        var history = List.of(new AdviceRequest.Turn(AdviceRequest.Role.USER, "Tôi thích công nghệ"));
        var genre = BookGenre.from(new AdviceRequest("Giờ tìm tiểu thuyết", history, 3));
        assertThat(genre.accepts(book("Văn học kinh điển"))).isTrue();
        assertThat(genre.accepts(book("Công nghệ & Trí tuệ nhân tạo"))).isFalse();
        var excluded = BookGenre.from(new AdviceRequest("Không thích tiểu thuyết, tìm sách công nghệ", List.of(), 3));
        assertThat(excluded.accepts(book("Công nghệ & Trí tuệ nhân tạo"))).isTrue();
        assertThat(excluded.accepts(book("Văn học hiện đại"))).isFalse();
    }
    @Test void keepsGenreForShortFollowupAndAllowsUnspecifiedQuestions() {
        var history = List.of(new AdviceRequest.Turn(AdviceRequest.Role.USER, "Sách công nghệ"));
        var genre = BookGenre.from(new AdviceRequest("Cuốn nào rẻ hơn?", history, 3));
        assertThat(genre.accepts(book("Công nghệ & Trí tuệ nhân tạo"))).isTrue();
        assertThat(genre.accepts(book("Triết học & Tư tưởng"))).isFalse();
        assertThat(BookGenre.from(new AdviceRequest("Gợi ý một cuốn sách", List.of(), 3)).accepts(book("Triết học & Tư tưởng"))).isTrue();
    }
    @Test void broadLiteratureMetadataDoesNotProveThatABookIsANovel() {
        var genre = BookGenre.from(new AdviceRequest("Tìm tiểu thuyết", List.of(), 3));
        var reference = new CatalogBook(2L, "Chuyện tình triết gia", BigDecimal.TEN,
                "Một loạt câu chuyện về các triết gia.", new CatalogBook.Reference(1L, "Văn học hiện đại"), null, List.of());
        assertThat(genre.accepts(reference)).isFalse();
        assertThat(genre.accepts(book("Việt Nam danh tác"))).isTrue();
    }
}
