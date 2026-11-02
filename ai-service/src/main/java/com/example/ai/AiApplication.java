package com.example.ai;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
public class AiApplication {
    public static void main(String[] args) { SpringApplication.run(AiApplication.class, args); }
}
