package com.projectboard.service;

import com.projectboard.dto.TaskResponse;
import com.projectboard.dto.TaskCreateRequest;
import com.projectboard.dto.TaskUpdateRequest;
import com.projectboard.dto.TaskMapper;
import com.projectboard.entity.Task;
import com.projectboard.entity.Task.TaskStatus;
import com.projectboard.entity.Task.TaskPriority;
import com.projectboard.exception.OptimisticLockingException;
import com.projectboard.exception.TaskNotFoundException;
import com.projectboard.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service layer for Task management
 *
 * Features:
 * - CRUD operations with optimistic locking
 * - Search and filtering
 * - Statistics and analytics
 * - Bulk operations
 * - Conflict detection and resolution
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;

    /**
     * Get all tasks
     */
    @Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public List<TaskResponse> getAllTasks() {
        log.info("Service: Getting all tasks");
        List<Task> tasks = taskRepository.findAll();
        return tasks.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get paginated tasks
     */
    @Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public Page<TaskResponse> getTasksPage(Pageable pageable) {
        log.info("Service: Getting tasks page - Page: {}, Size: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<Task> taskPage = taskRepository.findAll(pageable);
        return taskPage.map(this::convertToResponseDTO);
    }

    /**
     * Get task by ID
     */
    @Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public TaskResponse getTaskById(Long id) {
        log.info("Service: Getting task by ID: {}", id);
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException("Task not found with ID: " + id));
        return convertToResponseDTO(task);
    }

    /**
     * Create new task
     */
    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public TaskResponse createTask(TaskCreateRequest request) {
        log.info("Service: Creating new task: {}", request.getTitle());

        TaskStatus status;
        TaskPriority priority;
        try {
            status = TaskStatus.valueOf(request.getStatus());
            priority = TaskPriority.valueOf(request.getPriority());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid enum value in create request: {}", e.getMessage());
            throw new IllegalArgumentException("Invalid status or priority value");
        }

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(status)
                .priority(priority)
                .assignee(request.getAssignee())
                .estimatedHours(request.getEstimatedHours())
                .tags(request.getTags())
                .createdBy(getCurrentUsername())
                .updatedBy(getCurrentUsername())
                .build();

        Task savedTask = taskRepository.save(task);
        log.info("Service: Task created with ID: {}", savedTask.getId());

        return convertToResponseDTO(savedTask);
    }

    /**
     * Update task with optimistic locking
     */
    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public TaskResponse updateTask(Long id, TaskUpdateRequest request) {
        log.info("Service: Updating task with ID: {}", id);

        try {
            Task existingTask = taskRepository.findById(id)
                    .orElseThrow(() -> new TaskNotFoundException("Task not found with ID: " + id));

            // Check version for optimistic locking
            if (!Objects.equals(existingTask.getVersion(), request.getVersion())) {
                log.warn("Optimistic locking conflict - Expected version: {}, Got: {}",
                        existingTask.getVersion(), request.getVersion());
                throw new OptimisticLockingException(
                    "Task was modified by another user",
                    existingTask.getVersion(),
                    request.getVersion(),
                    convertToResponseDTO(existingTask)
                );
            }

            // Validate and convert enum values
            TaskStatus status;
            TaskPriority priority;
            try {
                status = TaskStatus.valueOf(request.getStatus());
                priority = TaskPriority.valueOf(request.getPriority());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid enum value in update request: {}", e.getMessage());
                throw new IllegalArgumentException("Invalid status or priority value");
            }

            // Update fields
            existingTask.setTitle(request.getTitle());
            existingTask.setDescription(request.getDescription());
            existingTask.setStatus(status);
            existingTask.setPriority(priority);
            existingTask.setAssignee(request.getAssignee());
            existingTask.setEstimatedHours(request.getEstimatedHours());
            existingTask.setTags(request.getTags());
            existingTask.setUpdatedBy(getCurrentUsername());
            existingTask.setUpdatedAt(LocalDateTime.now());

            Task savedTask = taskRepository.save(existingTask);
            log.info("Service: Task updated successfully with ID: {}", savedTask.getId());

            return convertToResponseDTO(savedTask);

        } catch (OptimisticLockingFailureException e) {
            log.warn("JPA Optimistic locking failure for task ID: {}", id);
            Task freshTask = taskRepository.findById(id)
                    .orElseThrow(() -> new TaskNotFoundException("Task not found with ID: " + id));
            throw new OptimisticLockingException(
                "Task was modified by another user",
                freshTask.getVersion(),
                request.getVersion(),
                convertToResponseDTO(freshTask)
            );
        }
    }

    /**
     * Delete task
     */
    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public void deleteTask(Long id) {
        log.info("Service: Deleting task with ID: {}", id);

        if (!taskRepository.existsById(id)) {
            throw new TaskNotFoundException("Task not found with ID: " + id);
        }

        taskRepository.deleteById(id);
        log.info("Service: Task deleted successfully with ID: {}", id);
    }

    /**
     * Search tasks with criteria
     * Uses database query for better performance
     */
    @Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public List<TaskResponse> searchTasks(String status, String priority, String assignee, String searchTerm) {
        log.info("Service: Searching tasks - Status: {}, Priority: {}, Assignee: {}, SearchTerm: {}",
                status, priority, assignee, searchTerm);

        // Convert string enums to enum types if provided
        TaskStatus taskStatus = null;
        TaskPriority taskPriority = null;
        
        if (status != null) {
            try {
                taskStatus = TaskStatus.valueOf(status);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status value in search: {}", status);
                throw new IllegalArgumentException("Invalid status: " + status + ". Valid values: BACKLOG, IN_PROGRESS, REVIEW, TESTING, DONE");
            }
        }
        
        if (priority != null) {
            try {
                taskPriority = TaskPriority.valueOf(priority);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid priority value in search: {}", priority);
                throw new IllegalArgumentException("Invalid priority: " + priority + ". Valid values: LOW, MEDIUM, HIGH, CRITICAL");
            }
        }

        // Use repository query method for efficient database-level filtering
        List<Task> tasks = taskRepository.findTasksByCriteria(taskStatus, taskPriority, assignee, searchTerm);

        return tasks.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get tasks by status
     */
    @Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public List<TaskResponse> getTasksByStatus(String status) {
        log.info("Service: Getting tasks by status: {}", status);
        try {
            TaskStatus taskStatus = TaskStatus.valueOf(status);
            List<Task> tasks = taskRepository.findByStatus(taskStatus);
            return tasks.stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid status value: {}", status);
            throw new IllegalArgumentException("Invalid status: " + status + ". Valid values: BACKLOG, IN_PROGRESS, REVIEW, TESTING, DONE");
        }
    }

    /**
     * Get tasks by priority
     */
    @Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public List<TaskResponse> getTasksByPriority(String priority) {
        log.info("Service: Getting tasks by priority: {}", priority);
        try {
            TaskPriority taskPriority = TaskPriority.valueOf(priority);
            List<Task> tasks = taskRepository.findByPriority(taskPriority);
            return tasks.stream()
                    .map(this::convertToResponseDTO)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid priority value: {}", priority);
            throw new IllegalArgumentException("Invalid priority: " + priority + ". Valid values: LOW, MEDIUM, HIGH, CRITICAL");
        }
    }

    /**
     * Get task statistics
     * Uses in-memory aggregation (acceptable for small-medium datasets)
     * For large datasets, consider using native SQL aggregation queries
     */
    @Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public Map<String, Object> getStatistics() {
        log.info("Service: Getting task statistics");

        // Load all tasks - for better performance with large datasets, use native aggregation queries
        List<Task> allTasks = taskRepository.findAll();
        long totalTasks = allTasks.size();

        Map<String, Object> statistics = new HashMap<>();
        statistics.put("totalTasks", totalTasks);
        statistics.put("timestamp", LocalDateTime.now());

        if (totalTasks == 0) {
            statistics.put("byStatus", Map.of());
            statistics.put("byPriority", Map.of());
            statistics.put("byAssignee", Map.of());
            statistics.put("completionRate", 0.0);
            statistics.put("totalEstimatedHours", 0.0);
            return statistics;
        }

        // Status distribution
        Map<String, Long> statusCounts = allTasks.stream()
                .collect(Collectors.groupingBy(
                        task -> task.getStatus().name(),
                        Collectors.counting()
                ));
        statistics.put("byStatus", statusCounts);

        // Priority distribution
        Map<String, Long> priorityCounts = allTasks.stream()
                .collect(Collectors.groupingBy(
                        task -> task.getPriority().name(),
                        Collectors.counting()
                ));
        statistics.put("byPriority", priorityCounts);

        // Assignee distribution
        Map<String, Long> assigneeCounts = allTasks.stream()
                .filter(task -> task.getAssignee() != null)
                .collect(Collectors.groupingBy(
                        Task::getAssignee,
                        Collectors.counting()
                ));
        statistics.put("byAssignee", assigneeCounts);

        // Progress metrics
        long completedTasks = statusCounts.getOrDefault("DONE", 0L);
        double completionRate = (double) completedTasks / totalTasks * 100;
        statistics.put("completionRate", Math.round(completionRate * 100.0) / 100.0);

        // Estimated hours
        double totalEstimatedHours = allTasks.stream()
                .filter(task -> task.getEstimatedHours() != null)
                .mapToDouble(Task::getEstimatedHours)
                .sum();
        statistics.put("totalEstimatedHours", totalEstimatedHours);

        log.info("Service: Statistics calculated - Total tasks: {}, Completion rate: {}%",
                totalTasks, completionRate);

        return statistics;
    }

    /**
     * Bulk update task status
     */
    @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public List<TaskResponse> bulkUpdateStatus(List<Long> taskIds, String newStatus) {
        log.info("Service: Bulk updating {} tasks to status: {}", taskIds.size(), newStatus);

        TaskStatus status;
        try {
            status = TaskStatus.valueOf(newStatus);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid status value in bulk update: {}", newStatus);
            throw new IllegalArgumentException("Invalid status: " + newStatus);
        }
        List<Task> tasks = taskRepository.findAllById(taskIds);

        tasks.forEach(task -> {
            task.setStatus(status);
            task.setUpdatedBy(getCurrentUsername());
        });

        List<Task> updatedTasks = taskRepository.saveAll(tasks);
        log.info("Service: Bulk update completed for {} tasks", updatedTasks.size());

        return updatedTasks.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get fresh task data for conflict resolution
     */
    @Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public TaskResponse getFreshTaskData(Long id) {
        log.info("Service: Getting fresh task data for ID: {}", id);
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException("Task not found with ID: " + id));
        return convertToResponseDTO(task);
    }

    /**
     * Check for conflicts before update
     */
    @Transactional(readOnly = true, isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
    public Map<String, Object> checkForConflicts(Long id, String lastFetchedStr) {
        log.info("Service: Checking for conflicts for task ID: {} since: {}", id, lastFetchedStr);

        Task currentTask = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException("Task not found with ID: " + id));

        try {
            LocalDateTime lastFetched = LocalDateTime.parse(lastFetchedStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            boolean hasConflict = currentTask.getUpdatedAt().isAfter(lastFetched);

            Map<String, Object> result = new HashMap<>();
            result.put("hasConflict", hasConflict);
            result.put("timestamp", LocalDateTime.now());

            if (hasConflict) {
                result.put("currentTaskData", convertToResponseDTO(currentTask));
            }

            return result;

        } catch (Exception e) {
            log.warn("Error parsing lastFetched date: {}", lastFetchedStr, e);
            // If we can't parse the date, assume there might be a conflict
            Map<String, Object> result = new HashMap<>();
            result.put("hasConflict", true);
            result.put("currentTaskData", convertToResponseDTO(currentTask));
            result.put("timestamp", LocalDateTime.now());
            result.put("error", "Invalid date format");
            return result;
        }
    }

    /**
     * Convert Task entity to Response DTO
     */
    private TaskResponse convertToResponseDTO(Task task) {
        return TaskMapper.toResponse(task);
    }

    /**
     * Helper to get the current username from security context
     */
    private String getCurrentUsername() {
        org.springframework.security.core.Authentication authentication = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        
        return "system"; // Fallback for non-authenticated requests (if any)
    }
}