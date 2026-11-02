package com.bookstore.userservices;

import com.bookstore.userservices.dto.request.ChangePasswordRequest;
import com.bookstore.userservices.dto.request.UpdateProfileRequest;
import com.bookstore.userservices.dto.request.UpdateUserStatusRequest;
import com.bookstore.userservices.entity.Role;
import com.bookstore.userservices.entity.RoleName;
import com.bookstore.userservices.entity.User;
import com.bookstore.userservices.entity.UserStatus;
import com.bookstore.userservices.repository.RoleRepository;
import com.bookstore.userservices.repository.UserRepository;
import com.bookstore.userservices.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@org.springframework.test.context.ActiveProfiles("test")
@org.springframework.context.annotation.Import(TestInfrastructure.class)
@Transactional
class UserManagementIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private MockMvc mockMvc;
    private Role adminRole;
    private Role customerRole;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        adminRole = roleRepository.findByRoleName(RoleName.ADMIN)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .roleName(RoleName.ADMIN)
                        .description("Quản trị viên")
                        .build()));

        customerRole = roleRepository.findByRoleName(RoleName.CUSTOMER)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .roleName(RoleName.CUSTOMER)
                        .description("Khách hàng")
                        .build()));
    }

    @Test
    void testGetMyProfile() throws Exception {
        String username = "profile_test_" + System.currentTimeMillis();
        User user = userRepository.save(User.builder()
                .username(username)
                .password(passwordEncoder.encode("123456"))
                .fullName("Profile Test")
                .email(username + "@test.com")
                .role(customerRole)
                .status(UserStatus.ACTIVE)
                .build());

        String token = jwtService.generateToken(user);

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.username", is(username)))
                .andExpect(jsonPath("$.data.role", is("CUSTOMER")));
    }

    @Test
    void testUpdateProfile() throws Exception {
        String username = "update_test_" + System.currentTimeMillis();
        User user = userRepository.save(User.builder()
                .username(username)
                .password(passwordEncoder.encode("123456"))
                .fullName("Old Name")
                .email(username + "@test.com")
                .role(customerRole)
                .status(UserStatus.ACTIVE)
                .build());

        String token = jwtService.generateToken(user);

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("New Name Updated")
                .email("new_" + username + "@test.com")
                .phone("0912345678")
                .address("Hồ Chí Minh")
                .build();

        mockMvc.perform(put("/api/users/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.fullName", is("New Name Updated")))
                .andExpect(jsonPath("$.data.phone", is("0912345678")));
    }

    @Test
    void testChangePasswordSuccessAndFailure() throws Exception {
        String username = "pwd_test_" + System.currentTimeMillis();
        User user = userRepository.save(User.builder()
                .username(username)
                .password(passwordEncoder.encode("OldPassword@123"))
                .fullName("Password Test")
                .email(username + "@test.com")
                .role(customerRole)
                .status(UserStatus.ACTIVE)
                .build());

        String token = jwtService.generateToken(user);

        // 1. Thất bại khi mật khẩu cũ sai
        ChangePasswordRequest wrongRequest = ChangePasswordRequest.builder()
                .oldPassword("WrongPassword@123")
                .newPassword("NewPassword@123")
                .build();

        mockMvc.perform(put("/api/users/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("không chính xác")));

        // 2. Thành công khi mật khẩu cũ đúng
        ChangePasswordRequest successRequest = ChangePasswordRequest.builder()
                .oldPassword("OldPassword@123")
                .newPassword("NewPassword@123")
                .build();

        mockMvc.perform(put("/api/users/change-password")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(successRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("thành công")));
    }

    @Test
    void testCustomerCannotAccessAdminApi() throws Exception {
        String username = "customer_not_admin_" + System.currentTimeMillis();
        User customer = userRepository.save(User.builder()
                .username(username)
                .password(passwordEncoder.encode("123456"))
                .fullName("Normal Customer")
                .email(username + "@test.com")
                .role(customerRole)
                .status(UserStatus.ACTIVE)
                .build());

        String token = jwtService.generateToken(customer);

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void testAdminGetAllUsersPaged() throws Exception {
        String adminUsername = "admin_page_" + System.currentTimeMillis();
        User admin = userRepository.save(User.builder()
                .username(adminUsername)
                .password(passwordEncoder.encode("admin123"))
                .fullName("Admin Page Test")
                .email(adminUsername + "@test.com")
                .role(adminRole)
                .status(UserStatus.ACTIVE)
                .build());

        String adminToken = jwtService.generateToken(admin);

        mockMvc.perform(get("/api/admin/users?pageNo=0&pageSize=5")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.items", notNullValue()))
                .andExpect(jsonPath("$.data.pageSize", is(5)));
    }

    @Test
    void testAdminCannotLockSelf() throws Exception {
        String adminUsername = "admin_self_lock_" + System.currentTimeMillis();
        User admin = userRepository.save(User.builder()
                .username(adminUsername)
                .password(passwordEncoder.encode("admin123"))
                .fullName("Admin Self Lock Test")
                .email(adminUsername + "@test.com")
                .role(adminRole)
                .status(UserStatus.ACTIVE)
                .build());

        String adminToken = jwtService.generateToken(admin);

        UpdateUserStatusRequest request = UpdateUserStatusRequest.builder()
                .status(UserStatus.LOCKED)
                .build();

        // Admin cố tình khóa tài khoản của chính mình -> Phải bị từ chối theo tài liệu thiết kế
        mockMvc.perform(patch("/api/admin/users/" + admin.getUserId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("không được phép tự khóa")));
    }
}
