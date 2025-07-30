package com.projectboard.service;

import com.projectboard.dto.TaskDTO;
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
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;

    /**
     * Get all tasks
     */
    @Transactional(readOnly = true)
    public List<TaskDTO.Response> getAllTasks() {
        log.info("Service: Getting all tasks");
        List<Task> tasks = taskRepository.findAll();
        return tasks.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get paginated tasks
     */
    @Transactional(readOnly = true)
    public Page<TaskDTO.Response> getTasksPage(Pageable pageable) {
        log.info("Service: Getting tasks page - Page: {}, Size: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<Task> taskPage = taskRepository.findAll(pageable);
        return taskPage.map(this::convertToResponseDTO);
    }

    /**
     * Get task by ID
     */
    @Transactional(readOnly = true)
    public TaskDTO.Response getTaskById(Long id) {
        log.info("Service: Getting task by ID: {}", id);
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException("Task not found with ID: " + id));
        return convertToResponseDTO(task);
    }

    /**
     * Create new task
     */
    public TaskDTO.Response createTask(TaskDTO.CreateRequest request) {
        log.info("Service: Creating new task: {}", request.getTitle());

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(TaskStatus.valueOf(request.getStatus()))
                .priority(TaskPriority.valueOf(request.getPriority()))
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
    public TaskDTO.Response updateTask(Long id, TaskDTO.UpdateRequest request) {
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

            // Update fields
            existingTask.setTitle(request.getTitle());
            existingTask.setDescription(request.getDescription());
            existingTask.setStatus(TaskStatus.valueOf(request.getStatus()));
            existingTask.setPriority(TaskPriority.valueOf(request.getPriority()));
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
     */
    @Transactional(readOnly = true)
    public List<TaskDTO.Response> searchTasks(String status, String priority, String assignee, String searchTerm) {
        log.info("Service: Searching tasks - Status: {}, Priority: {}, Assignee: {}, SearchTerm: {}",
                status, priority, assignee, searchTerm);

        List<Task> allTasks = taskRepository.findAll();

        return allTasks.stream()
                .filter(task -> status == null || task.getStatus().name().equals(status))
                .filter(task -> priority == null || task.getPriority().name().equals(priority))
                .filter(task -> assignee == null ||
                        (task.getAssignee() != null && task.getAssignee().toLowerCase().contains(assignee.toLowerCase())))
                .filter(task -> searchTerm == null ||
                        task.getTitle().toLowerCase().contains(searchTerm.toLowerCase()) ||
                        task.getDescription().toLowerCase().contains(searchTerm.toLowerCase()))
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get tasks by status
     */
    @Transactional(readOnly = true)
    public List<TaskDTO.Response> getTasksByStatus(String status) {
        log.info("Service: Getting tasks by status: {}", status);
        TaskStatus taskStatus = TaskStatus.valueOf(status);
        List<Task> tasks = taskRepository.findByStatus(taskStatus);
        return tasks.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get tasks by priority
     */
    @Transactional(readOnly = true)
    public List<TaskDTO.Response> getTasksByPriority(String priority) {
        log.info("Service: Getting tasks by priority: {}", priority);
        TaskPriority taskPriority = TaskPriority.valueOf(priority);
        List<Task> tasks = taskRepository.findByPriority(taskPriority);
        return tasks.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get task statistics
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getStatistics() {
        log.info("Service: Getting task statistics");

        List<Task> allTasks = taskRepository.findAll();

        Map<String, Object> statistics = new HashMap<>();

        // Basic counts
        statistics.put("totalTasks", allTasks.size());
        statistics.put("timestamp", LocalDateTime.now());

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
        double completionRate = allTasks.isEmpty() ? 0.0 : (double) completedTasks / allTasks.size() * 100;
        statistics.put("completionRate", Math.round(completionRate * 100.0) / 100.0);

        // Estimated hours
        double totalEstimatedHours = allTasks.stream()
                .filter(task -> task.getEstimatedHours() != null)
                .mapToDouble(Task::getEstimatedHours)
                .sum();
        statistics.put("totalEstimatedHours", totalEstimatedHours);

        log.info("Service: Statistics calculated - Total tasks: {}, Completion rate: {}%",
                allTasks.size(), completionRate);

        return statistics;
    }

    /**
     * Bulk update task status
     */
    public List<TaskDTO.Response> bulkUpdateStatus(List<Long> taskIds, String newStatus) {
        log.info("Service: Bulk updating {} tasks to status: {}", taskIds.size(), newStatus);

        TaskStatus status = TaskStatus.valueOf(newStatus);
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
    @Transactional(readOnly = true)
    public TaskDTO.Response getFreshTaskData(Long id) {
        log.info("Service: Getting fresh task data for ID: {}", id);
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new TaskNotFoundException("Task not found with ID: " + id));
        return convertToResponseDTO(task);
    }

    /**
     * Check for conflicts before update
     */
    @Transactional(readOnly = true)
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
    private TaskDTO.Response convertToResponseDTO(Task task) {
        return TaskDTO.fromEntity(task);
    }

    /**
     * Helper to get the current username - simplified without security for this demo.
     */
    private String getCurrentUsername() {
        return "system";
    }
}