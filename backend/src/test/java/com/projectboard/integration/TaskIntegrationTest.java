package com.projectboard.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.projectboard.dto.TaskDTO;
import com.projectboard.entity.Task;
import com.projectboard.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Full integration tests for Task management
 * Tests complete flow from HTTP request to database persistence
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TaskIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TaskRepository taskRepository;

    private TaskDTO.CreateRequest createRequest;
    private Task existingTask;

    @BeforeEach
    void setUp() {
        // Clear database
        taskRepository.deleteAll();

        createRequest = TaskDTO.CreateRequest.builder()
                .title("Integration Test Task")
                .description("Testing full integration flow")
                .status("BACKLOG")
                .priority("HIGH")
                .assignee("Integration Tester")
                .estimatedHours(4.0)
                .tags("integration,testing,fullstack")
                .build();

        existingTask = Task.builder()
                .title("Existing Task")
                .description("Pre-existing task for testing")
                .status(Task.TaskStatus.IN_PROGRESS)
                .priority(Task.TaskPriority.MEDIUM)
                .assignee("Existing User")
                .estimatedHours(3.0)
                .tags("existing,test")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build();
    }

    @Test
    @DisplayName("Full CRUD Integration Test - Create, Read, Update, Delete")
    void fullCrudIntegration_Success() throws Exception {
        // Step 1: Create Task
        String createResponse = mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("Integration Test Task")))
                .andExpect(jsonPath("$.status", is("BACKLOG")))
                .andExpect(jsonPath("$.version", is(0)))
                .andReturn()
                .getResponse()
                .getContentAsString();

        // Extract created task ID
        TaskDTO.Response createdTask = objectMapper.readValue(createResponse, TaskDTO.Response.class);
        Long taskId = createdTask.getId();

        // Step 2: Read Task
        mockMvc.perform(get("/api/tasks/" + taskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(taskId.intValue())))
                .andExpect(jsonPath("$.title", is("Integration Test Task")))
                .andExpect(jsonPath("$.assignee", is("Integration Tester")));

        // Step 3: Update Task
        TaskDTO.UpdateRequest updateRequest = TaskDTO.UpdateRequest.builder()
                .title("Updated Integration Task")
                .description("Updated description via integration test")
                .status("IN_PROGRESS")
                .priority("CRITICAL")
                .assignee("Updated Tester")
                .estimatedHours(6.0)
                .tags("updated,integration,testing")
                .version(createdTask.getVersion()) // Use version from created task
                .build();

        mockMvc.perform(put("/api/tasks/" + taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Updated Integration Task")))
                .andExpect(jsonPath("$.status", is("IN_PROGRESS")))
                .andExpect(jsonPath("$.priority", is("CRITICAL")))
                .andExpect(jsonPath("$.version", greaterThanOrEqualTo(0))) // Version should exist and be valid
                .andExpect(jsonPath("$.updatedAt", not(equalTo(jsonPath("$.createdAt").toString())))); // Update timestamp should be different

        // Step 4: Verify Update in Database
        mockMvc.perform(get("/api/tasks/" + taskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Updated Integration Task")))
                .andExpect(jsonPath("$.assignee", is("Updated Tester")));

        // Step 5: Delete Task
        mockMvc.perform(delete("/api/tasks/" + taskId))
                .andExpect(status().isNoContent());

        // Step 6: Verify Deletion
        mockMvc.perform(get("/api/tasks/" + taskId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Optimistic Locking Integration Test - Version Conflict")
    void optimisticLockingIntegration_VersionConflict() throws Exception {
        // Step 1: Create initial task
        Task savedTask = taskRepository.save(existingTask);
        Long taskId = savedTask.getId();
        Long originalVersion = savedTask.getVersion();

        // Step 2: Simulate concurrent modification by updating task directly in DB
        // This simulates another user/session modifying the task
        Task taskFromDb = taskRepository.findById(taskId).orElseThrow();
        taskFromDb.setTitle("Modified by Another User");
        taskFromDb.setAssignee("Another User");
        taskFromDb.setUpdatedBy("another_user");
        taskFromDb.setUpdatedAt(LocalDateTime.now());
        Task modifiedTask = taskRepository.saveAndFlush(taskFromDb);
        Long newVersion = modifiedTask.getVersion();

        // Step 3: Attempt to update with stale version
        TaskDTO.UpdateRequest staleUpdateRequest = TaskDTO.UpdateRequest.builder()
                .title("My Update")
                .description("My changes")
                .status("DONE")
                .priority("LOW")
                .assignee("My User")
                .estimatedHours(2.0)
                .tags("my,update")
                .version(originalVersion) // Using stale version
                .build();

        // Step 4: Expect conflict response
        mockMvc.perform(put("/api/tasks/" + taskId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(staleUpdateRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error", is("OPTIMISTIC_LOCK_CONFLICT")))
                .andExpect(jsonPath("$.message", containsString("Task was modified")))
                .andExpect(jsonPath("$.currentData.title", is("Modified by Another User")))
                .andExpect(jsonPath("$.currentData.version", is(newVersion.intValue())));

        // Step 5: Verify original modification is preserved
        mockMvc.perform(get("/api/tasks/" + taskId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Modified by Another User")))
                .andExpect(jsonPath("$.assignee", is("Another User")))
                .andExpect(jsonPath("$.version", is(newVersion.intValue())));
    }

    @Test
    @DisplayName("Search Integration Test - Multiple Criteria")
    void searchIntegration_MultipleCriteria() throws Exception {
        // Step 1: Create multiple tasks with different properties
        Task task1 = Task.builder()
                .title("Backend API Development")
                .description("Implement REST endpoints")
                .status(Task.TaskStatus.BACKLOG)
                .priority(Task.TaskPriority.HIGH)
                .assignee("John Developer")
                .tags("backend,api,java")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build();

        Task task2 = Task.builder()
                .title("Frontend UI Components")
                .description("Create Angular components")
                .status(Task.TaskStatus.IN_PROGRESS)
                .priority(Task.TaskPriority.MEDIUM)
                .assignee("Jane Frontend")
                .tags("frontend,angular,ui")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build();

        Task task3 = Task.builder()
                .title("Database Migration")
                .description("Update schema for new features")
                .status(Task.TaskStatus.DONE)
                .priority(Task.TaskPriority.LOW)
                .assignee("John Developer")
                .tags("database,migration")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build();

        taskRepository.save(task1);
        taskRepository.save(task2);
        taskRepository.save(task3);

        // Step 2: Search by title
        mockMvc.perform(get("/api/tasks/search")
                        .param("searchTerm", "Backend"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title", containsString("Backend")));

        // Step 3: Search by assignee
        mockMvc.perform(get("/api/tasks/search")
                        .param("assignee", "John"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].assignee", everyItem(containsString("John"))));

        // Step 4: Search by status
        mockMvc.perform(get("/api/tasks/search")
                        .param("status", "IN_PROGRESS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status", is("IN_PROGRESS")));

        // Step 5: Search by tags (using searchTerm)
        mockMvc.perform(get("/api/tasks/search")
                        .param("searchTerm", "angular"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].tags", containsString("angular")));
    }

    @Test
    @DisplayName("Statistics Integration Test - Task Counts by Status")
    void statisticsIntegration_TaskCountsByStatus() throws Exception {
        // Step 1: Create tasks with different statuses
        taskRepository.save(Task.builder()
                .title("Task 1")
                .description("Task 1 description")
                .status(Task.TaskStatus.BACKLOG)
                .priority(Task.TaskPriority.LOW)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build());
        taskRepository.save(Task.builder()
                .title("Task 2")
                .description("Task 2 description")
                .status(Task.TaskStatus.BACKLOG)
                .priority(Task.TaskPriority.MEDIUM)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build());
        taskRepository.save(Task.builder()
                .title("Task 3")
                .description("Task 3 description")
                .status(Task.TaskStatus.IN_PROGRESS)
                .priority(Task.TaskPriority.HIGH)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build());
        taskRepository.save(Task.builder()
                .title("Task 4")
                .description("Task 4 description")
                .status(Task.TaskStatus.REVIEW)
                .priority(Task.TaskPriority.LOW)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build());
        taskRepository.save(Task.builder()
                .title("Task 5")
                .description("Task 5 description")
                .status(Task.TaskStatus.DONE)
                .priority(Task.TaskPriority.MEDIUM)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build());
        taskRepository.save(Task.builder()
                .title("Task 6")
                .description("Task 6 description")
                .status(Task.TaskStatus.DONE)
                .priority(Task.TaskPriority.HIGH)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build());

        // Step 2: Verify statistics
        mockMvc.perform(get("/api/tasks/statistics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalTasks", is(6)))
                .andExpect(jsonPath("$.byStatus.BACKLOG", is(2)))
                .andExpect(jsonPath("$.byStatus.IN_PROGRESS", is(1)))
                .andExpect(jsonPath("$.byStatus.REVIEW", is(1)))
                .andExpect(jsonPath("$.byStatus.DONE", is(2)))
                .andExpect(jsonPath("$.completionRate", closeTo(33.33, 0.01)));
    }

    @Test
    @DisplayName("Error Handling Integration Test - Invalid Requests")
    void errorHandlingIntegration_InvalidRequests() throws Exception {
        // Test 1: Create task with missing required fields
        TaskDTO.CreateRequest invalidRequest = TaskDTO.CreateRequest.builder()
                .description("Missing title")
                .build();

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        // Test 2: Get non-existent task
        mockMvc.perform(get("/api/tasks/999999"))
                .andExpect(status().isNotFound());

        // Test 3: Update non-existent task
        TaskDTO.UpdateRequest updateRequest = TaskDTO.UpdateRequest.builder()
                .title("Update Non-existent")
                .status("DONE")
                .priority("LOW")
                .version(0L)
                .build();

        mockMvc.perform(put("/api/tasks/999999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound());

        // Test 4: Delete non-existent task
        mockMvc.perform(delete("/api/tasks/999999"))
                .andExpect(status().isNotFound());
    }
}
