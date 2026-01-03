package com.projectboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Task Statistics Response DTO
 * 
 * Statistics and analytics data for tasks.
 * Used in GET /api/tasks/statistics endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskStatisticsResponse {
    private Long totalTasks;
    private Map<String, Long> byStatus;
    private Map<String, Long> byPriority;
    private Map<String, Long> byAssignee;
    private Double completionRate;
    private Double totalEstimatedHours;
    private LocalDateTime timestamp;
}



