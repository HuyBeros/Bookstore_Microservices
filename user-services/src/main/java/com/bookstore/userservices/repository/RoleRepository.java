package com.bookstore.userservices.repository;

import com.bookstore.userservices.entity.Role;
import com.bookstore.userservices.entity.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository truy xuất và thao tác dữ liệu bảng 'roles'.
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {

    /**
     * Tìm kiếm vai trò dựa trên enum RoleName.
     *
     * @param roleName tên vai trò (ADMIN, STAFF, CUSTOMER)
     * @return Optional chứa Role nếu tìm thấy
     */
    Optional<Role> findByRoleName(RoleName roleName);

    /**
     * Kiểm tra sự tồn tại của vai trò trong CSDL.
     *
     * @param roleName tên vai trò
     * @return true nếu đã tồn tại, ngược lại false
     */
    boolean existsByRoleName(RoleName roleName);
}
