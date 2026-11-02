package com.bookstore.userservices;

import com.bookstore.userservices.dto.request.LoginRequest;
import com.bookstore.userservices.dto.request.RegisterRequest;
import com.bookstore.userservices.entity.Role;
import com.bookstore.userservices.entity.RoleName;
import com.bookstore.userservices.entity.User;
import com.bookstore.userservices.entity.UserStatus;
import com.bookstore.userservices.repository.RoleRepository;
import com.bookstore.userservices.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.bookstore.userservices.dto.request.ForgotPasswordRequest;
import com.bookstore.userservices.dto.request.ResetPasswordRequest;
import com.bookstore.userservices.dto.request.VerifyOtpRequest;
import com.bookstore.userservices.security.JwtService;
import com.bookstore.userservices.service.OtpService;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@org.springframework.test.context.ActiveProfiles("test")
@org.springframework.context.annotation.Import(TestInfrastructure.class)
@Transactional
class AuthIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private OtpService otpService;

    private Role customerRole;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                .apply(springSecurity())
                .build();

        customerRole = roleRepository.findByRoleName(RoleName.CUSTOMER)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .roleName(RoleName.CUSTOMER)
                        .description("Khách hàng")
                        .build()));
    }

    @Test
    void testRegisterSuccess() throws Exception {
        String uniqueSuffix = String.valueOf(System.currentTimeMillis());
        RegisterRequest request = RegisterRequest.builder()
                .username("testuser_" + uniqueSuffix)
                .password("Password@123")
                .fullName("Test User " + uniqueSuffix)
                .email("test_" + uniqueSuffix + "@example.com")
                .phone("0987654321")
                .address("Hà Nội")
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("thành công")))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.username", is(request.getUsername())))
                .andExpect(jsonPath("$.data.role", is("CUSTOMER")));
    }

    @Test
    void testRegisterValidationFailure() throws Exception {
        RegisterRequest invalidRequest = RegisterRequest.builder()
                .username("") // Blank username
                .password("123") // Too short
                .email("not-an-email") // Invalid email
                .build();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.data.username", notNullValue()))
                .andExpect(jsonPath("$.data.password", notNullValue()))
                .andExpect(jsonPath("$.data.email", notNullValue()));
    }

    @Test
    void testLoginSuccess() throws Exception {
        String username = "login_success_" + System.currentTimeMillis();
        String password = "mypassword123";

        userRepository.save(User.builder()
                .username(username)
                .password(passwordEncoder.encode(password))
                .fullName("User Login Success")
                .email(username + "@example.com")
                .role(customerRole)
                .status(UserStatus.ACTIVE)
                .build());

        LoginRequest request = LoginRequest.builder()
                .usernameOrEmail(username)
                .password(password)
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.data.username", is(username)));
    }

    @Test
    void testLoginWrongPassword() throws Exception {
        String username = "login_fail_" + System.currentTimeMillis();

        userRepository.save(User.builder()
                .username(username)
                .password(passwordEncoder.encode("correctpass"))
                .fullName("User Login Fail")
                .email(username + "@example.com")
                .role(customerRole)
                .status(UserStatus.ACTIVE)
                .build());

        LoginRequest request = LoginRequest.builder()
                .usernameOrEmail(username)
                .password("wrongpass")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", is("Tên đăng nhập hoặc mật khẩu không chính xác")));
    }

    @Test
    void testLoginLockedAccount() throws Exception {
        String username = "login_locked_" + System.currentTimeMillis();

        userRepository.save(User.builder()
                .username(username)
                .password(passwordEncoder.encode("password123"))
                .fullName("User Locked")
                .email(username + "@example.com")
                .role(customerRole)
                .status(UserStatus.LOCKED)
                .build());

        LoginRequest request = LoginRequest.builder()
                .usernameOrEmail(username)
                .password("password123")
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("bị khóa")));
    }

    @Test
    void testLogoutSuccessAndTokenBlacklist() throws Exception {
        String username = "logout_test_" + System.currentTimeMillis();
        String password = "password123";

        userRepository.save(User.builder()
                .username(username)
                .password(passwordEncoder.encode(password))
                .fullName("User Logout Test")
                .email(username + "@example.com")
                .role(customerRole)
                .status(UserStatus.ACTIVE)
                .build());

        // 1. Đăng nhập để lấy token
        LoginRequest loginRequest = LoginRequest.builder()
                .usernameOrEmail(username)
                .password(password)
                .build();

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseJson = loginResult.getResponse().getContentAsString();
        String accessToken = JsonPath.read(responseJson, "$.data.accessToken");

        // 2. Xác nhận có thể truy cập endpoint bảo mật bằng token này
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.username", is(username)));

        // 3. Thực hiện Đăng xuất (Logout) -> Đưa token vào Blacklist
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("thành công")));

        // 4. Thử gọi lại endpoint bảo mật với token đã bị Blacklist -> Phải trả về 401 Unauthorized
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isUnauthorized());

        // Signing in again, even within the same second, must issue a distinct
        // token so that the old token's revocation cannot reject the new login.
        MvcResult nextLogin = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk()).andReturn();
        String nextToken = JsonPath.read(nextLogin.getResponse().getContentAsString(), "$.data.accessToken");
        org.junit.jupiter.api.Assertions.assertNotEquals(accessToken, nextToken);
        org.junit.jupiter.api.Assertions.assertNotNull(jwtService.extractClaim(nextToken, io.jsonwebtoken.Claims::getId));
        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + nextToken))
                .andExpect(status().isOk());
    }

    @Test
    void testForgotPasswordAndResetPasswordFlow() throws Exception {
        String username = "otp_test_" + System.currentTimeMillis();
        String email = username + "@example.com";
        String oldPassword = "oldPassword123";
        String newPassword = "newPassword456";

        userRepository.save(User.builder()
                .username(username)
                .password(passwordEncoder.encode(oldPassword))
                .fullName("User OTP Test")
                .email(email)
                .role(customerRole)
                .status(UserStatus.ACTIVE)
                .build());

        // 1. Quên mật khẩu -> Yêu cầu gửi OTP
        ForgotPasswordRequest forgotRequest = ForgotPasswordRequest.builder()
                .email(email)
                .build();

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forgotRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // 2. Thử xác thực OTP sai -> 400 Bad Request
        VerifyOtpRequest wrongOtpRequest = VerifyOtpRequest.builder()
                .email(email)
                .otp("000000")
                .build();

        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongOtpRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));

        // 3. Lấy mã OTP thực tế đã tạo từ OtpService
        String validOtp = otpService.generateOtp(email);

        // 4. Xác thực OTP đúng -> 200 OK
        VerifyOtpRequest correctOtpRequest = VerifyOtpRequest.builder()
                .email(email)
                .otp(validOtp)
                .build();

        mockMvc.perform(post("/api/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(correctOtpRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // 5. Đặt lại mật khẩu với OTP hợp lệ -> 200 OK
        ResetPasswordRequest resetRequest = ResetPasswordRequest.builder()
                .email(email)
                .otp(validOtp)
                .newPassword(newPassword)
                .build();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // 6. Đăng nhập với mật khẩu mới thành công
        LoginRequest loginNewRequest = LoginRequest.builder()
                .usernameOrEmail(username)
                .password(newPassword)
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginNewRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.username", is(username)));
    }
}
