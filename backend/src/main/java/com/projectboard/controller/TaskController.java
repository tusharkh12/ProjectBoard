package com.projectboard.controller;

import com.projectboard.dto.TaskDTO;
import com.projectboard.service.TaskService;
import com.projectboard.exception.OptimisticLockingException;
import com.projectboard.exception.TaskNotFoundException;
import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Task management
 *
 * Features:
 * - Full CRUD operations
 * - Optimistic locking with conflict handling
 * - Search and filtering
 * - Statistics endpoints
 * - Pagination support
 */
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    /**
     * Get all tasks
     */
    @GetMapping
    public ResponseEntity<List<TaskDTO.Response>> getAllTasks() {
        List<TaskDTO.Response> tasks = taskService.getAllTasks();
        return ResponseEntity.ok(tasks);
    }

    /**
     * Get paginated tasks
     */
    @GetMapping("/page")
    public ResponseEntity<Page<TaskDTO.Response>> getTasksPage(Pageable pageable) {
        Page<TaskDTO.Response> tasks = taskService.getTasksPage(pageable);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Get task by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<TaskDTO.Response> getTaskById(@PathVariable Long id) {
        try {
            TaskDTO.Response task = taskService.getTaskById(id);
            return ResponseEntity.ok(task);
        } catch (TaskNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Create new task
     */
    @PostMapping
    public ResponseEntity<TaskDTO.Response> createTask(@Valid @RequestBody TaskDTO.CreateRequest request) {
        TaskDTO.Response createdTask = taskService.createTask(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTask);
    }

    /**
     * Update existing task with optimistic locking
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskDTO.UpdateRequest request) {
        try {
            TaskDTO.Response updatedTask = taskService.updateTask(id, request);
            return ResponseEntity.ok(updatedTask);
        } catch (TaskNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (OptimisticLockingException e) {
            // Return conflict with current task data for resolution
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "error", "OPTIMISTIC_LOCK_CONFLICT",
                "message", "Task was modified by another user. Please refresh and try again.",
                "currentData", e.getCurrentTaskData(),
                "timestamp", System.currentTimeMillis()
            ));
        }
    }

    /**
     * Delete task
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        try {
            taskService.deleteTask(id);
            return ResponseEntity.noContent().build();
        } catch (TaskNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Search tasks with criteria
     */
    @GetMapping("/search")
    public ResponseEntity<List<TaskDTO.Response>> searchTasks(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String assignee,
            @RequestParam(required = false) String searchTerm) {

        List<TaskDTO.Response> tasks = taskService.searchTasks(status, priority, assignee, searchTerm);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Get tasks by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<TaskDTO.Response>> getTasksByStatus(@PathVariable String status) {
        List<TaskDTO.Response> tasks = taskService.getTasksByStatus(status);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Get tasks by priority
     */
    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<TaskDTO.Response>> getTasksByPriority(@PathVariable String priority) {
        List<TaskDTO.Response> tasks = taskService.getTasksByPriority(priority);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Get task statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        Map<String, Object> statistics = taskService.getStatistics();
        return ResponseEntity.ok(statistics);
    }

    /**
     * Bulk update task status
     */
    @PatchMapping("/bulk-status")
    public ResponseEntity<List<TaskDTO.Response>> bulkUpdateStatus(
            @RequestBody Map<String, Object> request) {

        @SuppressWarnings("unchecked")
        List<Long> taskIds = (List<Long>) request.get("taskIds");
        String newStatus = (String) request.get("status");

        List<TaskDTO.Response> updatedTasks = taskService.bulkUpdateStatus(taskIds, newStatus);
        return ResponseEntity.ok(updatedTasks);
    }

    /**
     * Get fresh task data for conflict resolution
     */
    @GetMapping("/{id}/fresh")
    public ResponseEntity<TaskDTO.Response> getFreshTaskData(@PathVariable Long id) {
        try {
            TaskDTO.Response task = taskService.getFreshTaskData(id);
            return ResponseEntity.ok(task);
        } catch (TaskNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Check for conflicts before update
     */
    @GetMapping("/{id}/conflict-check")
    public ResponseEntity<Map<String, Object>> checkForConflicts(
            @PathVariable Long id,
            @RequestParam String lastFetched) {

        Map<String, Object> conflictInfo = taskService.checkForConflicts(id, lastFetched);
        return ResponseEntity.ok(conflictInfo);
    }
}