package com.example.catalog.Integration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.JsonNode;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BookFilterTests {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @MockitoBean JwtDecoder decoder;
    long categoryA, categoryB, publisherA, publisherB, authorA, authorB, first, second, third;
    @BeforeEach void data() throws Exception {
        categoryA = create("categories", "{\"name\":\"Hội họa đồng bộ\"}");
        categoryB = create("categories", "{\"name\":\"Tư duy đồng bộ\"}");
        publisherA = create("publishers", "{\"name\":\"Nhà xuất bản A đồng bộ\"}");
        publisherB = create("publishers", "{\"name\":\"Nhà xuất bản B đồng bộ\"}");
        authorA = create("authors", "{\"name\":\"Đặng Thị Đồng Bộ\"}");
        authorB = create("authors", "{\"name\":\"Tác giả Đồng Bộ\"}");
        first = book("A", 50, categoryA, publisherA, authorA + "," + authorB);
        second = book("B", 100, categoryA, publisherB, "" + authorB);
        third = book("C", 150, categoryB, publisherB, "" + authorA);
    }
    @Test void findsVietnameseWithOrWithoutAccentsAndKeepsEmptyResultsEmpty() throws Exception {
        for (String q : new String[]{"nghe thuat dong bo", "NGHỆ THUẬT ĐỒNG BỘ"}) {
            mvc.perform(get("/api/catalog/books").param("q", q))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(3));
        }
        mvc.perform(get("/api/catalog/books").param("q", "dang thi dong bo"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2));
        mvc.perform(get("/api/catalog/books").param("q", "no-such-book-xyz123"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content").isEmpty()).andExpect(jsonPath("$.totalElements").value(0));
    }
    @Test void combinesMultipleChoicesAndPaginatesTheActualResult() throws Exception {
        mvc.perform(get("/api/catalog/books").param("q", "nghe thuat dong bo")
                .param("categoryIds", categoryA + "," + categoryB).param("authorIds", authorA + "," + authorB)
                .param("sort", "price-asc").param("size", "1").param("page", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(3)).andExpect(jsonPath("$.content[0].id").value(second));
        mvc.perform(get("/api/catalog/books").param("categoryId", "" + categoryA).param("publisherId", "" + publisherB)
                .param("minPrice", "0").param("maxPrice", "120"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(second));
    }
    @Test void facetCountsFollowQueryAndOtherDimensionsWithoutDoubleCountingAuthors() throws Exception {
        JsonNode all = filters("/api/catalog/filters");
        assertThat(all.path("total").asLong()).isEqualTo(3);
        assertThat(count(all, "categories", categoryA)).isEqualTo(2);
        assertThat(count(all, "categories", categoryB)).isEqualTo(1);
        assertThat(count(all, "authors", authorA)).isEqualTo(2);
        assertThat(count(all, "authors", authorB)).isEqualTo(2);
        JsonNode narrowed = filters("/api/catalog/filters?categoryId=" + categoryA + "&publisherId=" + publisherB);
        assertThat(narrowed.path("total").asLong()).isEqualTo(1);
        assertThat(count(narrowed, "categories", categoryA)).isEqualTo(1);
        assertThat(count(narrowed, "categories", categoryB)).isEqualTo(1);
        assertThat(count(narrowed, "publishers", publisherA)).isEqualTo(1);
        assertThat(count(narrowed, "authors", authorA)).isZero();
        assertThat(count(narrowed, "authors", authorB)).isEqualTo(1);
    }
    @Test void reflectsPriceChangesAndDeactivatedBooksAndRejectsInvalidFilters() throws Exception {
        mvc.perform(delete("/api/catalog/books/" + second).with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isNoContent());
        mvc.perform(put("/api/catalog/books/" + third).with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Nghệ thuật đồng bộ C\",\"price\":25,\"categoryId\":"
                        + categoryB + ",\"publisherId\":" + publisherB + ",\"authorIds\":[" + authorA + "]}"))
                .andExpect(status().isOk());
        JsonNode after = filters("/api/catalog/filters");
        assertThat(after.path("total").asLong()).isEqualTo(2);
        assertThat(count(after, "categories", categoryA)).isEqualTo(1);
        assertThat(after.path("minPrice").decimalValue()).isEqualByComparingTo("25");
        assertThat(after.path("maxPrice").decimalValue()).isEqualByComparingTo("50");
        mvc.perform(get("/api/catalog/filters").param("categoryIds", "0")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/catalog/filters").param("minPrice", "200").param("maxPrice", "100")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/catalog/books").param("page", "-1")).andExpect(status().isBadRequest());
    }
    private JsonNode filters(String url) throws Exception {
        return json.readTree(mvc.perform(get(url).param("q", "nghe thuat dong bo")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()).path("data");
    }
    private long count(JsonNode response, String dimension, long id) {
        for (JsonNode option : response.path(dimension)) if (option.path("id").asLong() == id) return option.path("count").asLong();
        throw new AssertionError("Missing filter " + dimension + ":" + id);
    }
    private long create(String resource, String body) throws Exception {
        return json.readTree(mvc.perform(post("/api/catalog/" + resource)
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).path("id").asLong();
    }
    private long book(String suffix, int price, long category, long publisher, String authors) throws Exception {
        return create("books", "{\"title\":\"Nghệ thuật đồng bộ " + suffix + "\",\"price\":" + price
                + ",\"categoryId\":" + category + ",\"publisherId\":" + publisher + ",\"authorIds\":[" + authors + "]}");
    }
}
