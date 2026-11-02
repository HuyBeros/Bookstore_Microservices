package com.bookstore.userservices.repository;

import com.bookstore.userservices.entity.RoleName;
import com.bookstore.userservices.entity.User;
import com.bookstore.userservices.entity.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.QueryHint;
import java.util.Optional;

/**
 * Repository truy xuất và thao tác dữ liệu bảng 'users'.
 * Cung cấp các phương thức tìm kiếm linh hoạt theo username, email và tìm kiếm phân trang đa điều kiện cho ADMIN.
 *
 * <p>Tất cả các query đều dùng {@code JOIN FETCH u.role} để Hibernate load User và Role
 * trong 1 câu SQL duy nhất, tránh vấn đề N+1 queries phát sinh từ {@code FetchType.EAGER}.</p>
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Tìm kiếm người dùng theo tên đăng nhập duy nhất.
     * Dùng JOIN FETCH để load Role ngay trong 1 SQL, tránh N+1 khi truy cập {@code user.getRole()}.
     */
    @Query("SELECT u FROM User u JOIN FETCH u.role WHERE u.username = :username")
    Optional<User> findByUsername(@Param("username") String username);

    /**
     * Tìm kiếm người dùng theo địa chỉ email duy nhất.
     * Dùng JOIN FETCH để load Role ngay trong 1 SQL, tránh N+1 khi truy cập {@code user.getRole()}.
     */
    @Query("SELECT u FROM User u JOIN FETCH u.role WHERE u.email = :email")
    Optional<User> findByEmail(@Param("email") String email);

    /**
     * Tìm kiếm người dùng bằng tên đăng nhập HOẶC địa chỉ email (phục vụ chức năng đăng nhập linh hoạt).
     * Dùng JOIN FETCH để load Role ngay trong 1 SQL, tránh N+1 khi truy cập {@code user.getRole()}.
     */
    @Query("SELECT u FROM User u JOIN FETCH u.role WHERE u.username = :username OR u.email = :email")
    Optional<User> findByUsernameOrEmail(@Param("username") String username, @Param("email") String email);

    /**
     * Kiểm tra tên đăng nhập đã tồn tại trong hệ thống chưa.
     */
    boolean existsByUsername(String username);

    /**
     * Kiểm tra địa chỉ email đã tồn tại trong hệ thống chưa.
     */
    boolean existsByEmail(String email);

    /**
     * Tìm kiếm danh sách người dùng có phân trang kết hợp nhiều bộ lọc động:
     * - Từ khóa keyword (khớp một phần không phân biệt hoa thường với username, email hoặc fullName)
     * - Vai trò roleName (nếu chỉ định)
     * - Trạng thái tài khoản status (nếu chỉ định)
     *
     * <p>Dùng {@code JOIN FETCH u.role} để Hibernate load User và Role trong 1 SQL,
     * tránh N+1 khi trả về danh sách lớn (ví dụ: pageSize=100).</p>
     * <p>{@code countQuery} được tách riêng (không JOIN FETCH) để tối ưu hiệu năng đếm tổng bản ghi.</p>
     *
     * @param keyword  từ khóa tìm kiếm
     * @param roleName vai trò cần lọc
     * @param status   trạng thái tài khoản cần lọc
     * @param pageable đối tượng phân trang và sắp xếp
     * @return Trang kết quả {@code Page<User>}
     */
    @Query(value = "SELECT u FROM User u JOIN FETCH u.role r WHERE " +
                   "(:keyword IS NULL OR :keyword = '' OR " +
                   "LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                   "LOWER(u.email)    LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                   "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
                   "(:roleName IS NULL OR r.roleName = :roleName) AND " +
                   "(:status IS NULL OR u.status = :status)",
           countQuery = "SELECT COUNT(u) FROM User u JOIN u.role r WHERE " +
                        "(:keyword IS NULL OR :keyword = '' OR " +
                        "LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "LOWER(u.email)    LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
                        "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
                        "(:roleName IS NULL OR r.roleName = :roleName) AND " +
                        "(:status IS NULL OR u.status = :status)")
    @QueryHints(@QueryHint(name = org.hibernate.jpa.HibernateHints.HINT_CACHEABLE, value = "true"))
    Page<User> searchUsers(
            @Param("keyword") String keyword,
            @Param("roleName") RoleName roleName,
            @Param("status") UserStatus status,
            Pageable pageable
    );
}
