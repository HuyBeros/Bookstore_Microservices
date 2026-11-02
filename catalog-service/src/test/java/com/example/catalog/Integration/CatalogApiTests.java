package com.example.catalog.Integration;

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
import tools.jackson.databind.ObjectMapper;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CatalogApiTests {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @MockitoBean JwtDecoder decoder;

    @Test void protectsWritesAndValidatesRequests() throws Exception {
        mvc.perform(post("/api/catalog/categories").contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Novel\"}")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/catalog/categories").with(jwt()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Novel\"}")).andExpect(status().isForbidden());
        mvc.perform(post("/api/catalog/categories").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"  \"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/catalog/books").param("size", "101")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/catalog/books/999999")).andExpect(status().isNotFound());
    }

    @Test void managesCatalogSearchAndReferentialIntegrity() throws Exception {
        long category = create("categories", "{\"name\":\"Programming\",\"description\":\"Technology\"}");
        long author = create("authors", "{\"name\":\"Joshua Bloch\",\"bio\":\"Engineer\"}");
        long publisher = create("publishers", "{\"name\":\"Addison Wesley\"}");
        mvc.perform(post("/api/catalog/categories").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\" programming \"}"))
                .andExpect(status().isConflict());
        String body = """
                {"title":"Effective Java","price":150000,"description":"Java best practices",
                 "categoryId":%d,"publisherId":%d,"authorIds":[%d]}
                """.formatted(category, publisher, author);
        long book = create("books", body);
        mvc.perform(get("/api/catalog/search").param("q", "bloch").param("categoryId", "" + category))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].authors[0].name").value("Joshua Bloch"));
        mvc.perform(get("/api/catalog/search").param("q", "%"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/catalog/search").param("minPrice", "200000").param("maxPrice", "100000"))
                .andExpect(status().isBadRequest());
        for (String path : new String[]{"categories/" + category, "authors/" + author, "publishers/" + publisher}) {
            mvc.perform(delete("/api/catalog/" + path).with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                    .andExpect(status().isConflict());
        }
        mvc.perform(put("/api/catalog/books/" + book).with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .contentType(MediaType.APPLICATION_JSON).content(body.replace("150000", "175000")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.price").value(175000));
        mvc.perform(delete("/api/catalog/books/" + book).with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/catalog/books/" + book)).andExpect(status().isNotFound());
        mvc.perform(get("/api/catalog/search").param("q", "Effective Java"))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test void rejectsMissingBookRelations() throws Exception {
        mvc.perform(post("/api/catalog/books").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Unknown\",\"price\":10,\"categoryId\":99999,\"publisherId\":99999,\"authorIds\":[99999]}"))
                .andExpect(status().isNotFound());
    }

    @Test void supportsMetadataCrudAndRejectsDuplicateRename() throws Exception {
        long first = create("categories", "{\"name\":\"Science\"}");
        long second = create("categories", "{\"name\":\"History\"}");
        mvc.perform(put("/api/catalog/categories/" + second)
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"SCIENCE\"}"))
                .andExpect(status().isConflict());
        for (String kind : new String[]{"categories", "authors", "publishers"}) {
            long id = create(kind, "{\"name\":\"Temporary\",\"description\":\"Description\",\"bio\":\"Biography\"}");
            mvc.perform(get("/api/catalog/" + kind + "/" + id))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Temporary"));
            mvc.perform(get("/api/catalog/" + kind)).andExpect(status().isOk())
                    .andExpect(jsonPath("$.content").isArray());
            mvc.perform(put("/api/catalog/" + kind + "/" + id)
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                    .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Updated\"}"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Updated"));
            mvc.perform(delete("/api/catalog/" + kind + "/" + id)
                    .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                    .andExpect(status().isNoContent());
            mvc.perform(get("/api/catalog/" + kind + "/" + id)).andExpect(status().isNotFound());
        }
    }

    @Test void filtersAndPaginatesBooksWithoutDuplicatingMultipleAuthors() throws Exception {
        long category = create("categories", "{\"name\":\"Computing\"}");
        long publisher = create("publishers", "{\"name\":\"Tech Press\"}");
        long firstAuthor = create("authors", "{\"name\":\"First Writer\"}");
        long secondAuthor = create("authors", "{\"name\":\"Second Writer\"}");
        String request = """
                {"title":"Computing One","price":50,"categoryId":%d,"publisherId":%d,"authorIds":[%d,%d]}
                """.formatted(category, publisher, secondAuthor, firstAuthor);
        long book = create("books", request);
        create("books", request.replace("Computing One", "Computing Two").replace(":50", ":100"));
        mvc.perform(get("/api/catalog/search").param("q", "Writer").param("categoryId", "" + category)
                .param("size", "1").param("sort", "price-asc"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2)).andExpect(jsonPath("$.content[0].price").value(50));
        mvc.perform(get("/api/catalog/books/" + book)).andExpect(status().isOk())
                .andExpect(jsonPath("$.authors[0].id").value(secondAuthor));
        mvc.perform(get("/api/catalog/search").param("publisherId", "" + publisher)
                .param("authorId", "" + firstAuthor).param("minPrice", "75").param("maxPrice", "150"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/api/catalog/books/batch").param("ids", book + "," + book + ",999999"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/catalog/books").param("sort", "invalid")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/catalog/books").with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .contentType(MediaType.APPLICATION_JSON)
                .content(request.replace(secondAuthor + "," + firstAuthor, firstAuthor + "," + firstAuthor)))
                .andExpect(status().isBadRequest());
    }

    private long create(String resource, String body) throws Exception {
        String response = mvc.perform(post("/api/catalog/" + resource)
                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(response).get("id").asLong();
    }
}
