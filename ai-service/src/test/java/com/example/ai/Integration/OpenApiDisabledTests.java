package com.example.ai.Integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "app.docs.enabled=false")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OpenApiDisabledTests {
    @Autowired MockMvc mvc;
    @MockitoBean JwtDecoder decoder;

    @Test void blocksDocumentationEvenWithAuthenticatedUserWhenDisabled() throws Exception {
        for (String path : new String[]{"/v3/api-docs", "/v3/api-docs.yaml",
                "/v3/api-docs/swagger-config", "/swagger-ui.html", "/swagger-ui/index.html"}) {
            mvc.perform(get(path).with(jwt())).andExpect(status().isForbidden());
        }
    }
}

