package com.projectboard.controller;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

/**
 * Test configuration for @WebMvcTest that excludes JPA auditing
 * This prevents the "JPA metamodel must not be empty" error
 */
@SpringBootApplication
@ComponentScan(basePackages = {
    "com.projectboard.controller",
    "com.projectboard.exception",
    "com.projectboard.dto"
})
public class TestConfiguration {
    // This configuration excludes JPA and auditing configurations
    // Only includes what's needed for web layer testing
}