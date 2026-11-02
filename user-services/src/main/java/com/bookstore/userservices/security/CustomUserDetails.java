package com.bookstore.userservices.security;

import com.bookstore.userservices.entity.User;
import com.bookstore.userservices.entity.UserStatus;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Lớp chuyển đổi (Adapter) từ Entity User trong CSDL sang đối tượng UserDetails của Spring Security.
 * Đóng gói thông tin xác thực, mật khẩu, trạng thái tài khoản và danh sách quyền hạn (Authorities).
 */
@Getter
@RequiredArgsConstructor
public class CustomUserDetails implements UserDetails {

    private static final String ROLE_PREFIX = "ROLE_";
    
    private final User user;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(ROLE_PREFIX + user.getRole().getRoleName().name()));
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getUsername();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return user.getStatus() == UserStatus.ACTIVE;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return user.getStatus() == UserStatus.ACTIVE;
    }
}
