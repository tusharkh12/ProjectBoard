package com.projectboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Task Search Criteria DTO
 * 
 * Criteria for filtering and searching tasks.
 * Used in GET /api/tasks/search endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskSearchCriteria {
    private String status;
    private String priority;
    private String assignee;
    private String searchTerm;
    private String sortBy;
    private String sortDirection;
}



