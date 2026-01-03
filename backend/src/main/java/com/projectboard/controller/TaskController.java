package com.projectboard.controller;

import com.projectboard.dto.TaskResponse;
import com.projectboard.dto.TaskCreateRequest;
import com.projectboard.dto.TaskUpdateRequest;
import com.projectboard.dto.TaskBulkUpdateRequest;
import com.projectboard.service.TaskService;
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
    public ResponseEntity<List<TaskResponse>> getAllTasks() {
        List<TaskResponse> tasks = taskService.getAllTasks();
        return ResponseEntity.ok(tasks);
    }

    /**
     * Get paginated tasks
     */
    @GetMapping("/page")
    public ResponseEntity<Page<TaskResponse>> getTasksPage(Pageable pageable) {
        Page<TaskResponse> tasks = taskService.getTasksPage(pageable);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Get task by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable Long id) {
        TaskResponse task = taskService.getTaskById(id);
        return ResponseEntity.ok(task);
    }

    /**
     * Create new task
     */
    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskCreateRequest request) {
        TaskResponse createdTask = taskService.createTask(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdTask);
    }

    /**
     * Update existing task with optimistic locking
     */
    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskUpdateRequest request) {
        TaskResponse updatedTask = taskService.updateTask(id, request);
        return ResponseEntity.ok(updatedTask);
    }

    /**
     * Delete task
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Search tasks with criteria
     */
    @GetMapping("/search")
    public ResponseEntity<List<TaskResponse>> searchTasks(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String assignee,
            @RequestParam(required = false) String searchTerm) {

        List<TaskResponse> tasks = taskService.searchTasks(status, priority, assignee, searchTerm);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Get tasks by status
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<TaskResponse>> getTasksByStatus(@PathVariable String status) {
        List<TaskResponse> tasks = taskService.getTasksByStatus(status);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Get tasks by priority
     */
    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<TaskResponse>> getTasksByPriority(@PathVariable String priority) {
        List<TaskResponse> tasks = taskService.getTasksByPriority(priority);
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
    public ResponseEntity<List<TaskResponse>> bulkUpdateStatus(
            @Valid @RequestBody TaskBulkUpdateRequest request) {

        List<TaskResponse> updatedTasks = taskService.bulkUpdateStatus(
                request.getTaskIds(), 
                request.getStatus());
        return ResponseEntity.ok(updatedTasks);
    }

    /**
     * Get fresh task data for conflict resolution
     */
    @GetMapping("/{id}/fresh")
    public ResponseEntity<TaskResponse> getFreshTaskData(@PathVariable Long id) {
        TaskResponse task = taskService.getFreshTaskData(id);
        return ResponseEntity.ok(task);
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