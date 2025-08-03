package com.projectboard.service;

import com.projectboard.dto.TaskDTO;
import com.projectboard.entity.Task;
import com.projectboard.exception.OptimisticLockingException;
import com.projectboard.exception.TaskNotFoundException;
import com.projectboard.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.OptimisticLockingFailureException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for TaskService business logic
 * Tests cover CRUD operations, validation, and optimistic locking
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TaskService Unit Tests")
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private TaskService taskService;

    private Task sampleTask;
    private TaskDTO.CreateRequest createRequest;
    private TaskDTO.UpdateRequest updateRequest;

    @BeforeEach
    void setUp() {
        sampleTask = Task.builder()
                .id(1L)
                .title("Sample Task")
                .description("Task description")
                .status(Task.TaskStatus.BACKLOG)
                .priority(Task.TaskPriority.MEDIUM)
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
    }

    @Test
    @DisplayName("Should retrieve all tasks successfully")
    void getAllTasks_Success() {
        List<Task> tasks = Arrays.asList(sampleTask);
        when(taskRepository.findAll()).thenReturn(tasks);

        List<TaskDTO.Response> result = taskService.getAllTasks();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Sample Task");
        assertThat(result.get(0).getStatus()).isEqualTo("BACKLOG");
        verify(taskRepository).findAll();
    }

    @Test
    @DisplayName("Should find task by ID successfully")
    void getTaskById_Success() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(sampleTask));

        TaskDTO.Response result = taskService.getTaskById(1L);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo("Sample Task");
        verify(taskRepository).findById(1L);
    }

    @Test
    @DisplayName("Should throw TaskNotFoundException when task not found")
    void getTaskById_NotFound() {
        when(taskRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.getTaskById(999L))
                .isInstanceOf(TaskNotFoundException.class)
                .hasMessage("Task not found with ID: 999");
        verify(taskRepository).findById(999L);
    }

    @Test
    @DisplayName("Should create task successfully")
    void createTask_Success() {
        Task savedTask = Task.builder()
                .id(2L)
                .title(createRequest.getTitle())
                .description(createRequest.getDescription())
                .status(Task.TaskStatus.BACKLOG)
                .priority(Task.TaskPriority.HIGH)
                .assignee(createRequest.getAssignee())
                .estimatedHours(createRequest.getEstimatedHours())
                .tags(createRequest.getTags())
                .version(0L)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build();

        when(taskRepository.save(any(Task.class))).thenReturn(savedTask);

        TaskDTO.Response result = taskService.createTask(createRequest);

        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(2L);
        assertThat(result.getTitle()).isEqualTo("New Task");
        assertThat(result.getStatus()).isEqualTo("BACKLOG");
        assertThat(result.getPriority()).isEqualTo("HIGH");
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    @DisplayName("Should update task successfully with correct version")
    void updateTask_Success() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(sampleTask));
        
        Task updatedTask = Task.builder()
                .id(1L)
                .title("Updated Task")
                .description("Updated description")
                .status(Task.TaskStatus.IN_PROGRESS)
                .priority(Task.TaskPriority.HIGH)
                .assignee("Jane Smith")
                .estimatedHours(4.0)
                .tags("backend,api")
                .version(2L) // Version incremented by JPA
                .createdAt(sampleTask.getCreatedAt())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build();

        when(taskRepository.save(any(Task.class))).thenReturn(updatedTask);

        TaskDTO.Response result = taskService.updateTask(1L, updateRequest);

        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Updated Task");
        assertThat(result.getStatus()).isEqualTo("IN_PROGRESS");
        assertThat(result.getPriority()).isEqualTo("HIGH");
        verify(taskRepository).findById(1L);
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    @DisplayName("Should throw OptimisticLockingException when version mismatch")
    void updateTask_VersionMismatch() {
        updateRequest = TaskDTO.UpdateRequest.builder()
                .title("Updated Task")
                .description("Updated description")
                .status("IN_PROGRESS")
                .priority("HIGH")
                .assignee("Jane Smith")
                .estimatedHours(4.0)
                .tags("backend,api")
                .version(0L) // Wrong version
                .build();

        when(taskRepository.findById(1L)).thenReturn(Optional.of(sampleTask));

        assertThatThrownBy(() -> taskService.updateTask(1L, updateRequest))
                .isInstanceOf(OptimisticLockingException.class)
                .hasMessage("Task was modified by another user");
        
        verify(taskRepository).findById(1L);
        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    @DisplayName("Should handle JPA OptimisticLockingFailureException")
    void updateTask_JpaOptimisticLockingFailure() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(sampleTask));
        when(taskRepository.save(any(Task.class))).thenThrow(new OptimisticLockingFailureException("Version conflict"));
        
        when(taskRepository.findById(1L)).thenReturn(Optional.of(sampleTask));

        assertThatThrownBy(() -> taskService.updateTask(1L, updateRequest))
                .isInstanceOf(OptimisticLockingException.class)
                .hasMessage("Task was modified by another user");
        
        verify(taskRepository, times(2)).findById(1L); // Once for update, once for fresh data
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    @DisplayName("Should throw TaskNotFoundException when updating non-existent task")
    void updateTask_TaskNotFound() {
        when(taskRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.updateTask(999L, updateRequest))
                .isInstanceOf(TaskNotFoundException.class)
                .hasMessage("Task not found with ID: 999");
        
        verify(taskRepository).findById(999L);
        verify(taskRepository, never()).save(any(Task.class));
    }

    @Test
    @DisplayName("Should delete task successfully")
    void deleteTask_Success() {
        when(taskRepository.existsById(1L)).thenReturn(true);

        taskService.deleteTask(1L);

        verify(taskRepository).existsById(1L);
        verify(taskRepository).deleteById(1L);
    }

    @Test
    @DisplayName("Should throw TaskNotFoundException when deleting non-existent task")
    void deleteTask_TaskNotFound() {
        when(taskRepository.existsById(999L)).thenReturn(false);

        assertThatThrownBy(() -> taskService.deleteTask(999L))
                .isInstanceOf(TaskNotFoundException.class)
                .hasMessage("Task not found with ID: 999");
        
        verify(taskRepository).existsById(999L);
        verify(taskRepository, never()).deleteById(any());
    }

    @Test
    @DisplayName("Should search tasks with criteria")
    void searchTasks_WithCriteria() {
        List<Task> tasks = Arrays.asList(sampleTask);
        when(taskRepository.findAll()).thenReturn(tasks);

        List<TaskDTO.Response> result = taskService.searchTasks(null, null, null, "Sample");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("Sample Task");
        verify(taskRepository).findAll();
    }

    @Test
    @DisplayName("Should get task statistics")
    void getTaskStatistics_Success() {
        List<Task> tasks = Arrays.asList(sampleTask);
        when(taskRepository.findAll()).thenReturn(tasks);

        Map<String, Object> result = taskService.getStatistics();

        assertThat(result).isNotNull();
        assertThat(result.get("totalTasks")).isEqualTo(1);
        assertThat(result).containsKey("byStatus");
        assertThat(result).containsKey("byPriority");
        assertThat(result).containsKey("byAssignee");
        assertThat(result).containsKey("completionRate");
        assertThat(result).containsKey("totalEstimatedHours");
        
        verify(taskRepository).findAll();
    }
}