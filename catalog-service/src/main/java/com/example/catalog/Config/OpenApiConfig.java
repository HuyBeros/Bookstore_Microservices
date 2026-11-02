package com.example.catalog.Config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import java.util.List;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
class OpenApiConfig {
    @Bean
    OpenAPI serviceOpenApi() {
        return new OpenAPI()
                .info(new Info().title("Catalog API").version("v1")
                        .description("Books, categories, authors, publishers and search. Writes require an ADMIN JWT."))
                .components(new Components().addSecuritySchemes("bearerAuth", new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
    }

    @Bean
    OpenApiCustomizer operationSecurity() {
        return api -> {
            if (api.getPaths() == null) {
                return;
            }
            api.getPaths().values().forEach(path -> path.readOperationsMap().forEach((method, operation) -> {
                if (method == io.swagger.v3.oas.models.PathItem.HttpMethod.GET) {
                    operation.setSecurity(List.of());
                } else {
                    operation.setSecurity(List.of(new SecurityRequirement().addList("bearerAuth")));
                }
            }));
        };
    }
}

