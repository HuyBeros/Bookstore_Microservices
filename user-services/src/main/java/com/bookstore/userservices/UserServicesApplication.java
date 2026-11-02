package com.bookstore.userservices;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Lớp khởi động chính của microservice User Service (StudyMate / BookStore AI).
 * Chịu trách nhiệm quản lý xác thực người dùng, bảo mật JWT và phân quyền quản trị hệ thống.
 */
@SpringBootApplication
public class UserServicesApplication {

    public static void main(String[] args) {
        SpringApplication.run(UserServicesApplication.class, args);
    }
}
