package com.projectboard.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Task Response DTO
 * 
 * Complete task data returned in API responses.
 * Includes all task fields including audit information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {
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



