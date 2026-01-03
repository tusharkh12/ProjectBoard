package com.projectboard.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Task Update Request DTO
 * 
 * Data required to update an existing task.
 * Includes version field for optimistic locking.
 * Used in PUT /api/tasks/{id} endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskUpdateRequest {
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



