package com.projectboard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Task Bulk Update Request DTO
 * 
 * Request for bulk updating multiple tasks.
 * Used in PATCH /api/tasks/bulk-status endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskBulkUpdateRequest {
    @NotEmpty(message = "Task IDs are required")
    private List<Long> taskIds;
    
    @NotBlank(message = "Status is required")
    @Pattern(regexp = "BACKLOG|IN_PROGRESS|REVIEW|TESTING|DONE", 
            message = "Status must be one of: BACKLOG, IN_PROGRESS, REVIEW, TESTING, DONE")
    private String status;
}



