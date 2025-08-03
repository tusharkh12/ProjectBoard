package com.projectboard.dto;

import com.projectboard.entity.Task;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Task Data Transfer Objects
 * 
 * Contains all DTOs for Task operations:
 * - Response: Complete task data for API responses
 * - CreateRequest: Data required to create a new task
 * - UpdateRequest: Data required to update existing task (includes version for optimistic locking)
 */
public class TaskDTO {

    /**
     * Response DTO - Complete task data for API responses
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        
        @NotBlank(message = "Title is required")
        private String title;
        
        private String description;
        
        @NotBlank(message = "Status is required")
        private String status;
        
        @NotBlank(message = "Priority is required")
        private String priority;
        
        private String assignee;
        
        @Min(value = 0, message = "Estimated hours must be positive")
        private Double estimatedHours;
        
        private String tags;
        
        @NotNull(message = "Version is required for optimistic locking")
        private Long version;
        
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private String createdBy;
        private String updatedBy;
    }

    /**
     * Create Request DTO - Data required to create a new task
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        @NotBlank(message = "Title is required")
        @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
        private String title;
        
        @Size(max = 1000, message = "Description cannot exceed 1000 characters")
        private String description;
        
        @NotBlank(message = "Status is required")
        @Pattern(regexp = "BACKLOG|IN_PROGRESS|REVIEW|TESTING|DONE", 
                message = "Status must be one of: BACKLOG, IN_PROGRESS, REVIEW, TESTING, DONE")
        private String status;
        
        @NotBlank(message = "Priority is required")
        @Pattern(regexp = "LOW|MEDIUM|HIGH|CRITICAL", 
                message = "Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL")
        private String priority;
        
        @Size(max = 100, message = "Assignee name cannot exceed 100 characters")
        private String assignee;
        
        @Min(value = 0, message = "Estimated hours must be positive")
        @Max(value = 1000, message = "Estimated hours cannot exceed 1000")
        private Double estimatedHours;
        
        @Size(max = 500, message = "Tags cannot exceed 500 characters")
        private String tags;
    }

    /**
     * Update Request DTO - Data required to update existing task
     * Includes version for optimistic locking
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateRequest {
        @NotBlank(message = "Title is required")
        @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
        private String title;
        
        @Size(max = 1000, message = "Description cannot exceed 1000 characters")
        private String description;
        
        @NotBlank(message = "Status is required")
        @Pattern(regexp = "BACKLOG|IN_PROGRESS|REVIEW|TESTING|DONE", 
                message = "Status must be one of: BACKLOG, IN_PROGRESS, REVIEW, TESTING, DONE")
        private String status;
        
        @NotBlank(message = "Priority is required")
        @Pattern(regexp = "LOW|MEDIUM|HIGH|CRITICAL", 
                message = "Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL")
        private String priority;
        
        @Size(max = 100, message = "Assignee name cannot exceed 100 characters")
        private String assignee;
        
        @Min(value = 0, message = "Estimated hours must be positive")
        @Max(value = 1000, message = "Estimated hours cannot exceed 1000")
        private Double estimatedHours;
        
        @Size(max = 500, message = "Tags cannot exceed 500 characters")
        private String tags;
        
        @NotNull(message = "Version is required for optimistic locking")
        private Long version;
    }

    /**
     * Search Criteria DTO - For filtering tasks
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchCriteria {
        private String status;
        private String priority;
        private String assignee;
        private String searchTerm;
        private String sortBy;
        private String sortDirection;
    }

    /**
     * Bulk Update Request DTO - For bulk operations
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BulkUpdateRequest {
        @NotEmpty(message = "Task IDs are required")
        private java.util.List<Long> taskIds;
        
        @NotBlank(message = "Status is required")
        @Pattern(regexp = "BACKLOG|IN_PROGRESS|REVIEW|TESTING|DONE", 
                message = "Status must be one of: BACKLOG, IN_PROGRESS, REVIEW, TESTING, DONE")
        private String status;
    }

    /**
     * Statistics Response DTO - For dashboard statistics
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatisticsResponse {
        private Long totalTasks;
        private java.util.Map<String, Long> byStatus;
        private java.util.Map<String, Long> byPriority;
        private java.util.Map<String, Long> byAssignee;
        private Double completionRate;
        private Double totalEstimatedHours;
        private LocalDateTime timestamp;
    }

    /**
     * Convert Task entity to Response DTO
     */
    public static Response fromEntity(Task task) {
        return Response.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus().name())
                .priority(task.getPriority().name())
                .assignee(task.getAssignee())
                .estimatedHours(task.getEstimatedHours())
                .tags(task.getTags())
                .version(task.getVersion())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .createdBy(task.getCreatedBy())
                .updatedBy(task.getUpdatedBy())
                .build();
    }

    /**
     * Convert CreateRequest DTO to Task entity
     */
    public static Task toEntity(CreateRequest request) {
        return Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(Task.TaskStatus.valueOf(request.getStatus()))
                .priority(Task.TaskPriority.valueOf(request.getPriority()))
                .assignee(request.getAssignee())
                .estimatedHours(request.getEstimatedHours())
                .tags(request.getTags())
                .build();
    }
} 