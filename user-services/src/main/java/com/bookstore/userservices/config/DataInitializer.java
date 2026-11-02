package com.bookstore.userservices.config;

import com.bookstore.userservices.entity.Role;
import com.bookstore.userservices.entity.RoleName;
import com.bookstore.userservices.entity.User;
import com.bookstore.userservices.entity.UserStatus;
import com.bookstore.userservices.repository.RoleRepository;
import com.bookstore.userservices.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Thành phần tự động khởi tạo dữ liệu mẫu (Seed Data) khi ứng dụng khởi chạy lần đầu.
 * Tự động tạo: 3 vai trò hệ thống (ADMIN, STAFF, CUSTOMER) và 1 tài khoản quản trị viên mặc định nếu chưa tồn tại.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.default.username}")
    private String defaultAdminUsername;

    @Value("${admin.default.password}")
    private String defaultAdminPassword;

    @Value("${admin.default.email}")
    private String defaultAdminEmail;

    /**
     * Phương thức thực thi ngay sau khi Spring ApplicationContext được nạp thành công.
     * Kiểm tra ADMIN_PASSWORD environment variable trước khi khởi tạo dữ liệu.
     *
     * @throws IllegalStateException nếu ADMIN_PASSWORD không được cấu hình
     */
    @Override
    public void run(String... args) {
        if (defaultAdminPassword == null || defaultAdminPassword.isBlank()) {
            throw new IllegalStateException(
                "ADMIN_PASSWORD environment variable is required. " +
                "Please set ADMIN_PASSWORD in your .env file or environment variables."
            );
        }
        initRoles();
        initAdminAccount();
    }

    /**
     * Khởi tạo danh sách các vai trò nếu trong CSDL chưa có.
     */
    private void initRoles() {
        for (RoleName roleName : RoleName.values()) {
            if (!roleRepository.existsByRoleName(roleName)) {
                Role role = Role.builder()
                        .roleName(roleName)
                        .description("Vai trò hệ thống " + roleName.name())
                        .build();
                roleRepository.save(role);
                log.info(">>> [DataInitializer] Đã khởi tạo vai trò: {}", roleName);
            }
        }
    }

    /**
     * Khởi tạo tài khoản Quản trị viên (ADMIN) mặc định nếu chưa có tài khoản nào trùng username.
     */
    private void initAdminAccount() {
        if (!userRepository.existsByUsername(defaultAdminUsername)) {
            Role adminRole = roleRepository.findByRoleName(RoleName.ADMIN)
                    .orElseThrow(() -> new IllegalStateException("Không tìm thấy vai trò ADMIN trong cơ sở dữ liệu"));

            User admin = User.builder()
                    .username(defaultAdminUsername)
                    .password(passwordEncoder.encode(defaultAdminPassword))
                    .fullName("Quản trị viên hệ thống")
                    .email(defaultAdminEmail)
                    .phone("0987654321")
                    .address("Hà Nội, Việt Nam")
                    .status(UserStatus.ACTIVE)
                    .role(adminRole)
                    .build();

            userRepository.save(admin);
            log.info(">>> [DataInitializer] Đã khởi tạo tài khoản Admin mặc định (username: {})", defaultAdminUsername);
        }
    }
}
