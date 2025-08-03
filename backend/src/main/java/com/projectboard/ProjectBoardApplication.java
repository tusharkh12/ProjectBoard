package com.projectboard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Main Application Class for ProjectBoard
 * 
 * Features:
 * - Collaborative Task Management
 * - REST API with CRUD Operations
 * - Angular 20 Frontend Integration
 * - JPA Auditing for automatic timestamps
 */
@SpringBootApplication
@EnableJpaAuditing
public class ProjectBoardApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProjectBoardApplication.class, args);
    }
} 