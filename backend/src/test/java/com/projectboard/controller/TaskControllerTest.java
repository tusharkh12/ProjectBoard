package com.projectboard.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectboard.dto.TaskDTO;
import com.projectboard.exception.OptimisticLockingException;
import com.projectboard.exception.TaskNotFoundException;
import com.projectboard.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.ContextConfiguration;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for TaskController REST endpoints
 * Tests HTTP layer, request/response handling, and error scenarios
 */
@WebMvcTest(controllers = TaskController.class)
@ContextConfiguration(classes = TestConfiguration.class)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TaskService taskService;

    private TaskDTO.Response sampleTaskResponse;
    private TaskDTO.CreateRequest createRequest;
    private TaskDTO.UpdateRequest updateRequest;
    private List<TaskDTO.Response> taskList;

    @BeforeEach
    void setUp() {
        sampleTaskResponse = TaskDTO.Response.builder()
                .id(1L)
                .title("Sample Task")
                .description("Task description")
                .status("BACKLOG")
                .priority("MEDIUM")
                .assignee("John Doe")
                .estimatedHours(5.0)
                .tags("backend,testing")
                .version(1L)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build();

        createRequest = TaskDTO.CreateRequest.builder()
                .title("New Task")
                .description("New task description")
                .status("BACKLOG")
                .priority("HIGH")
                .assignee("Jane Smith")
                .estimatedHours(3.0)
                .tags("frontend,ui")
                .build();

        updateRequest = TaskDTO.UpdateRequest.builder()
                .title("Updated Task")
                .description("Updated description")
                .status("IN_PROGRESS")
                .priority("HIGH")
                .assignee("Jane Smith")
                .estimatedHours(4.0)
                .tags("backend,api")
                .version(1L)
                .build();

        taskList = Arrays.asList(sampleTaskResponse);
    }

    @Test
    @DisplayName("GET /api/tasks - Should return all tasks")
    void getAllTasks_Success() throws Exception {
        // Given
        when(taskService.getAllTasks()).thenReturn(taskList);

        // When/Then
        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(1)))
                .andExpect(jsonPath("$[0].title", is("Sample Task")))
                .andExpect(jsonPath("$[0].status", is("BACKLOG")))
                .andExpect(jsonPath("$[0].priority", is("MEDIUM")));

        verify(taskService).getAllTasks();
    }

    @Test
    @DisplayName("GET /api/tasks/{id} - Should return specific task")
    void getTaskById_Success() throws Exception {
        // Given
        when(taskService.getTaskById(1L)).thenReturn(sampleTaskResponse);

        // When/Then
        mockMvc.perform(get("/api/tasks/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.title", is("Sample Task")))
                .andExpect(jsonPath("$.assignee", is("John Doe")))
                .andExpect(jsonPath("$.version", is(1)));

        verify(taskService).getTaskById(1L);
    }

    @Test
    @DisplayName("GET /api/tasks/{id} - Should return 404 when task not found")
    void getTaskById_NotFound() throws Exception {
        // Given
        when(taskService.getTaskById(999L)).thenThrow(new TaskNotFoundException("Task not found with ID: 999"));

        // When/Then
        mockMvc.perform(get("/api/tasks/999"))
                .andExpect(status().isNotFound());

        verify(taskService).getTaskById(999L);
    }

    @Test
    @DisplayName("POST /api/tasks - Should create new task")
    void createTask_Success() throws Exception {
        // Given
        TaskDTO.Response createdTask = TaskDTO.Response.builder()
                .id(2L)
                .title("New Task")
                .description("New task description")
                .status("BACKLOG")
                .priority("HIGH")
                .assignee("Jane Smith")
                .estimatedHours(3.0)
                .tags("frontend,ui")
                .version(0L)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build();

        when(taskService.createTask(any(TaskDTO.CreateRequest.class))).thenReturn(createdTask);

        // When/Then
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(2)))
                .andExpect(jsonPath("$.title", is("New Task")))
                .andExpect(jsonPath("$.priority", is("HIGH")))
                .andExpect(jsonPath("$.version", is(0)));

        verify(taskService).createTask(any(TaskDTO.CreateRequest.class));
    }

    @Test
    @DisplayName("POST /api/tasks - Should return 400 for invalid request")
    void createTask_InvalidRequest() throws Exception {
        // Given - Invalid request with missing required fields
        TaskDTO.CreateRequest invalidRequest = TaskDTO.CreateRequest.builder()
                .description("Missing title")
                .build();

        // When/Then
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(taskService, never()).createTask(any(TaskDTO.CreateRequest.class));
    }

    @Test
    @DisplayName("PUT /api/tasks/{id} - Should update existing task")
    void updateTask_Success() throws Exception {
        // Given
        TaskDTO.Response updatedTask = TaskDTO.Response.builder()
                .id(1L)
                .title("Updated Task")
                .description("Updated description")
                .status("IN_PROGRESS")
                .priority("HIGH")
                .assignee("Jane Smith")
                .estimatedHours(4.0)
                .tags("backend,api")
                .version(2L)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build();

        when(taskService.updateTask(eq(1L), any(TaskDTO.UpdateRequest.class))).thenReturn(updatedTask);

        // When/Then
        mockMvc.perform(put("/api/tasks/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.title", is("Updated Task")))
                .andExpect(jsonPath("$.status", is("IN_PROGRESS")))
                .andExpect(jsonPath("$.version", is(2)));

        verify(taskService).updateTask(eq(1L), any(TaskDTO.UpdateRequest.class));
    }

    @Test
    @DisplayName("PUT /api/tasks/{id} - Should return 409 on version conflict")
    void updateTask_OptimisticLockingConflict() throws Exception {
        // Given
        TaskDTO.Response conflictData = TaskDTO.Response.builder()
                .id(1L)
                .title("Conflicting Task")
                .description("Task modified by another user")
                .status("IN_PROGRESS")
                .priority("HIGH")
                .assignee("Other User")
                .estimatedHours(6.0)
                .tags("backend,api")
                .version(2L)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build();

        OptimisticLockingException exception = new OptimisticLockingException(
                "Task was modified by another user", 2L, 1L, conflictData);

        when(taskService.updateTask(eq(1L), any(TaskDTO.UpdateRequest.class))).thenThrow(exception);

        // When/Then
        mockMvc.perform(put("/api/tasks/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.error", is("OPTIMISTIC_LOCK_CONFLICT")))
                .andExpect(jsonPath("$.message", is("Task was modified by another user. Please refresh and try again.")))
                .andExpect(jsonPath("$.currentData.id", is(1)))
                .andExpect(jsonPath("$.currentData.version", is(2)));

        verify(taskService).updateTask(eq(1L), any(TaskDTO.UpdateRequest.class));
    }

    @Test
    @DisplayName("PUT /api/tasks/{id} - Should return 404 when task not found")
    void updateTask_TaskNotFound() throws Exception {
        // Given
        when(taskService.updateTask(eq(999L), any(TaskDTO.UpdateRequest.class)))
                .thenThrow(new TaskNotFoundException("Task not found with ID: 999"));

        // When/Then
        mockMvc.perform(put("/api/tasks/999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound());

        verify(taskService).updateTask(eq(999L), any(TaskDTO.UpdateRequest.class));
    }

    @Test
    @DisplayName("DELETE /api/tasks/{id} - Should delete task successfully")
    void deleteTask_Success() throws Exception {
        // Given
        doNothing().when(taskService).deleteTask(1L);

        // When/Then
        mockMvc.perform(delete("/api/tasks/1"))
                .andExpect(status().isNoContent());

        verify(taskService).deleteTask(1L);
    }

    @Test
    @DisplayName("DELETE /api/tasks/{id} - Should return 404 when task not found")
    void deleteTask_TaskNotFound() throws Exception {
        // Given
        doThrow(new TaskNotFoundException("Task not found with ID: 999"))
                .when(taskService).deleteTask(999L);

        // When/Then
        mockMvc.perform(delete("/api/tasks/999"))
                .andExpect(status().isNotFound());

        verify(taskService).deleteTask(999L);
    }

    @Test
    @DisplayName("GET /api/tasks/search - Should search tasks with criteria")
    void searchTasks_Success() throws Exception {
        // Given
        when(taskService.searchTasks(any(), any(), any(), any()))
                .thenReturn(taskList);

        // When/Then
        mockMvc.perform(get("/api/tasks/search")
                        .param("status", "BACKLOG")
                        .param("priority", "MEDIUM")
                        .param("assignee", "John")
                        .param("searchTerm", "Sample"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", is("Sample Task")));

        verify(taskService).searchTasks("BACKLOG", "MEDIUM", "John", "Sample");
    }

    @Test
    @DisplayName("GET /api/tasks/statistics - Should return task statistics")
    void getTaskStatistics_Success() throws Exception {
        // Given
        Map<String, Long> byStatus = Map.of(
                "BACKLOG", 3L,
                "IN_PROGRESS", 2L,
                "REVIEW", 2L,
                "TESTING", 1L,
                "DONE", 2L
        );

        when(taskService.getStatistics()).thenReturn(Map.of(
                "totalTasks", 10,
                "byStatus", byStatus,
                "completionRate", 20.0,
                "totalEstimatedHours", 50.0
        ));

        // When/Then
        mockMvc.perform(get("/api/tasks/statistics"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.totalTasks", is(10)))
                .andExpect(jsonPath("$.byStatus.BACKLOG", is(3)))
                .andExpect(jsonPath("$.byStatus.IN_PROGRESS", is(2)))
                .andExpect(jsonPath("$.byStatus.DONE", is(2)))
                .andExpect(jsonPath("$.completionRate", is(20.0)));

        verify(taskService).getStatistics();
    }
}