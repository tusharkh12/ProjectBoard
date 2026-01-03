package com.projectboard.dto;

import com.projectboard.entity.Task;

/**
 * Task Mapper Utility
 * 
 * Provides static methods for converting between Task entity and DTOs.
 * Centralizes mapping logic for consistency across the application.
 */
public final class TaskMapper {

    private TaskMapper() {
        // Utility class - prevent instantiation
    }

    /**
     * Convert Task entity to TaskResponse DTO
     * 
     * @param task the Task entity to convert
     * @return TaskResponse DTO with all task data
     */
    public static TaskResponse toResponse(Task task) {
        return TaskResponse.builder()
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
     * Convert TaskCreateRequest DTO to Task entity
     * 
     * @param request the TaskCreateRequest DTO
     * @return Task entity ready for persistence
     */
    public static Task toEntity(TaskCreateRequest request) {
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



