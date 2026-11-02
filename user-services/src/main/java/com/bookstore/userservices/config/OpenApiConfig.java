package com.bookstore.userservices.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Lớp cấu hình tài liệu API Swagger / OpenAPI (SpringDoc).
 * Tích hợp sơ đồ xác thực Bearer JWT để hỗ trợ kiểm thử trực tiếp trên giao diện Swagger UI.
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "Bearer Authentication";

    /**
     * Khởi tạo đối tượng OpenAPI tùy chỉnh chứa thông tin dự án và Security Scheme.
     *
     * @return đối tượng cấu hình OpenAPI
     */
    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("BookStore AI - User Service API")
                        .description("Tài liệu API cho User & Auth Service - Dự án Quản lý cửa hàng sách tích hợp AI (HaUI)")
                        .version("1.0.0")
                        .contact(new Contact().name("Nhom 2 - DACN HaUI"))
                )
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Nhập Access Token (JWT) sau khi đăng nhập để xác thực các API bảo mật")
                        )
                );
    }
}
