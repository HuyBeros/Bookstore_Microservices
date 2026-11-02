package com.bookstore.userservices;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@org.springframework.test.context.ActiveProfiles("test")
@org.springframework.context.annotation.Import(TestInfrastructure.class)
class UserServicesApplicationTests {

	@Test
	void contextLoads() {
	}

}
