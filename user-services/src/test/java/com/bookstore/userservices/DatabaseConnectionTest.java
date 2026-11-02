package com.bookstore.userservices;

import com.bookstore.userservices.entity.Role;
import com.bookstore.userservices.repository.RoleRepository;
import com.bookstore.userservices.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@org.springframework.test.context.ActiveProfiles("test")
@org.springframework.context.annotation.Import(TestInfrastructure.class)
class DatabaseConnectionTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void testDatabaseConnection() throws Exception {
        assertNotNull(dataSource, "DataSource should not be null");

        try (Connection connection = dataSource.getConnection()) {
            assertNotNull(connection, "Connection should be valid");
            assertTrue(connection.isValid(2), "Database connection should be open");

            DatabaseMetaData metaData = connection.getMetaData();
            System.out.println("=== KET NOI POSTGRESQL THANH CONG! ===");
            System.out.println("Database Product Name: " + metaData.getDatabaseProductName());
            System.out.println("Database Product Version: " + metaData.getDatabaseProductVersion());
            System.out.println("Database URL: " + metaData.getURL());
            System.out.println("User Name: " + metaData.getUserName());

            System.out.println("\n=== DANH SACH BANG TRONG DATABASE ===");
            try (ResultSet tables = metaData.getTables(null, "public", "%", new String[]{"TABLE"})) {
                while (tables.next()) {
                    System.out.println(" - Table: " + tables.getString("TABLE_NAME"));
                }
            }

            System.out.println("\n=== KIEM TRA DU LIEU ROLES VA USERS ===");
            List<Role> roles = roleRepository.findAll();
            System.out.println("Tong so roles: " + roles.size());
            for (Role role : roles) {
                System.out.println("  Role ID: " + role.getRoleId() + " | Name: " + role.getRoleName() + " | Desc: " + role.getDescription());
            }

            long userCount = userRepository.count();
            System.out.println("Tong so users: " + userCount);
            System.out.println("========================================");
        }
    }
}
