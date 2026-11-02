package com.bookstore.userservices.security;

import com.bookstore.userservices.entity.User;
import com.bookstore.userservices.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Dịch vụ nạp thông tin người dùng từ cơ sở dữ liệu phục vụ xác thực của Spring Security.
 * Hỗ trợ tìm kiếm linh hoạt qua tên đăng nhập (username) hoặc địa chỉ thư điện tử (email).
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Nạp đối tượng UserDetails dựa trên tên đăng nhập hoặc email.
     *
     * @param usernameOrEmail tên đăng nhập hoặc email của người dùng
     * @return đối tượng UserDetails hợp lệ của Spring Security
     * @throws UsernameNotFoundException nếu không tìm thấy người dùng trong CSDL
     */
    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        User user = userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với username hoặc email: " + usernameOrEmail));
        return new CustomUserDetails(user);
    }
}
