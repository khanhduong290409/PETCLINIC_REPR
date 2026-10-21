package com.example.backend_pet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// @EnableScheduling: bật các job @Scheduled (nhắc lịch khám qua email — AppointmentNotificationService)
@SpringBootApplication
@EnableScheduling
public class BackendPetApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendPetApplication.class, args);
    }

}
