package com.projectboard.repository;

import com.projectboard.entity.Task;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;

/**
 * Integration tests for TaskRepository data access layer
 * Tests JPA queries, constraints, and database interactions
 */
@DataJpaTest
@ActiveProfiles("test")
class TaskRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private TaskRepository taskRepository;

    private Task sampleTask1;
    private Task sampleTask2;
    private Task sampleTask3;

    @BeforeEach
    void setUp() {
        sampleTask1 = Task.builder()
                .title("Backend API Task")
                .description("Implement REST API endpoints")
                .status(Task.TaskStatus.BACKLOG)
                .priority(Task.TaskPriority.HIGH)
                .assignee("John Doe")
                .estimatedHours(8.0)
                .tags("backend,api,spring")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build();

        sampleTask2 = Task.builder()
                .title("Frontend UI Components")
                .description("Create Angular components for task management")
                .status(Task.TaskStatus.IN_PROGRESS)
                .priority(Task.TaskPriority.MEDIUM)
                .assignee("Jane Smith")
                .estimatedHours(6.0)
                .tags("frontend,angular,ui")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build();

        sampleTask3 = Task.builder()
                .title("Database Migration")
                .description("Update database schema")
                .status(Task.TaskStatus.DONE)
                .priority(Task.TaskPriority.LOW)
                .assignee("John Doe")
                .estimatedHours(2.0)
                .tags("database,migration")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .createdBy("system")
                .updatedBy("system")
                .build();
    }

    @Test
    @DisplayName("Should save and retrieve task successfully")
    void saveAndFindTask_Success() {
        Task savedTask = taskRepository.save(sampleTask1);
        Optional<Task> foundTask = taskRepository.findById(savedTask.getId());

        assertThat(foundTask).isPresent();
        assertThat(foundTask.get().getTitle()).isEqualTo("Backend API Task");
        assertThat(foundTask.get().getStatus()).isEqualTo(Task.TaskStatus.BACKLOG);
        assertThat(foundTask.get().getVersion()).isEqualTo(0L); // Initial version
    }

    @Test
    @DisplayName("Should automatically set version for optimistic locking")
    void optimisticLocking_VersionAutoSet() {
        Task savedTask = taskRepository.save(sampleTask1);

        assertThat(savedTask.getVersion()).isNotNull();
        assertThat(savedTask.getVersion()).isEqualTo(0L);
    }

    @Test
    @DisplayName("Should increment version on update")
    void optimisticLocking_VersionIncrement() {
        Task savedTask = entityManager.persistAndFlush(sampleTask1);
        entityManager.clear();

        Task taskToUpdate = taskRepository.findById(savedTask.getId()).orElseThrow();
        taskToUpdate.setTitle("Updated Title");
        Task updatedTask = taskRepository.saveAndFlush(taskToUpdate);

        assertThat(updatedTask.getVersion()).isEqualTo(1L); // Version incremented
        assertThat(updatedTask.getTitle()).isEqualTo("Updated Title");
    }

    @Test
    @DisplayName("Should find all tasks")
    void findAll_Success() {
        entityManager.persist(sampleTask1);
        entityManager.persist(sampleTask2);
        entityManager.persist(sampleTask3);
        entityManager.flush();

        List<Task> allTasks = taskRepository.findAll();

        assertThat(allTasks).hasSize(3);
        assertThat(allTasks).extracting(Task::getTitle)
                .containsExactlyInAnyOrder("Backend API Task", "Frontend UI Components", "Database Migration");
    }

    @Test
    @DisplayName("Should find tasks by status")
    void findByStatus_Success() {
        entityManager.persist(sampleTask1); // BACKLOG
        entityManager.persist(sampleTask2); // IN_PROGRESS
        entityManager.persist(sampleTask3); // DONE
        entityManager.flush();

        List<Task> backlogTasks = taskRepository.findByStatus(Task.TaskStatus.BACKLOG);
        List<Task> inProgressTasks = taskRepository.findByStatus(Task.TaskStatus.IN_PROGRESS);
        List<Task> doneTasks = taskRepository.findByStatus(Task.TaskStatus.DONE);

        assertThat(backlogTasks).hasSize(1);
        assertThat(backlogTasks.get(0).getTitle()).isEqualTo("Backend API Task");
        assertThat(inProgressTasks).hasSize(1);
        assertThat(inProgressTasks.get(0).getTitle()).isEqualTo("Frontend UI Components");
        assertThat(doneTasks).hasSize(1);
        assertThat(doneTasks.get(0).getTitle()).isEqualTo("Database Migration");
    }

    @Test
    @DisplayName("Should search tasks by title or description")
    void searchByTitleOrDescription_Success() {
        entityManager.persist(sampleTask1); // "Backend API Task"
        entityManager.persist(sampleTask2); // "Frontend UI Components"
        entityManager.flush();

        List<Task> backendTasks = taskRepository.searchByTitleOrDescription("backend");
        List<Task> apiTasks = taskRepository.searchByTitleOrDescription("API");

        assertThat(backendTasks).hasSize(1);
        assertThat(backendTasks.get(0).getTitle()).isEqualTo("Backend API Task");
        
        assertThat(apiTasks).hasSize(1);
        assertThat(apiTasks.get(0).getTitle()).isEqualTo("Backend API Task");
    }

    @Test
    @DisplayName("Should search tasks by assignee")
    void searchByAssignee_Success() {
        entityManager.persist(sampleTask1); // Assignee: "John Doe"
        entityManager.persist(sampleTask2); // Assignee: "Jane Smith"
        entityManager.flush();

        List<Task> johnTasks = taskRepository.findByAssigneeIgnoreCase("John Doe");
        List<Task> janeTasks = taskRepository.findByAssigneeIgnoreCase("Jane Smith");

        assertThat(johnTasks).hasSize(1);
        assertThat(johnTasks.get(0).getAssignee()).isEqualTo("John Doe");
        
        assertThat(janeTasks).hasSize(1);
        assertThat(janeTasks.get(0).getAssignee()).isEqualTo("Jane Smith");
    }

    @Test
    @DisplayName("Should search tasks by multiple criteria")
    void searchByCriteria_Success() {
        entityManager.persist(sampleTask1); // BACKLOG, HIGH, "John Doe"
        entityManager.persist(sampleTask2); // IN_PROGRESS, MEDIUM, "Jane Smith"
        entityManager.persist(sampleTask3); // DONE, LOW, "John Doe"
        entityManager.flush();

        List<Task> johnTasks = taskRepository.findTasksByCriteria(null, null, "John", null);
        List<Task> highPriorityTasks = taskRepository.findTasksByCriteria(null, Task.TaskPriority.HIGH, null, null);
        List<Task> backlogTasks = taskRepository.findTasksByCriteria(Task.TaskStatus.BACKLOG, null, null, null);

        assertThat(johnTasks).hasSize(2);
        assertThat(johnTasks).extracting(Task::getAssignee).allMatch(assignee -> assignee.contains("John"));
        
        assertThat(highPriorityTasks).hasSize(1);
        assertThat(highPriorityTasks.get(0).getPriority()).isEqualTo(Task.TaskPriority.HIGH);
        
        assertThat(backlogTasks).hasSize(1);
        assertThat(backlogTasks.get(0).getStatus()).isEqualTo(Task.TaskStatus.BACKLOG);
    }

    @Test
    @DisplayName("Should delete task successfully")
    void deleteTask_Success() {
        Task savedTask = entityManager.persistAndFlush(sampleTask1);
        Long taskId = savedTask.getId();
        
        taskRepository.deleteById(taskId);
        entityManager.flush();

        Optional<Task> deletedTask = taskRepository.findById(taskId);
        assertThat(deletedTask).isEmpty();
    }

    @Test
    @DisplayName("Should check if task exists")
    void existsById_Success() {
        Task savedTask = entityManager.persistAndFlush(sampleTask1);

        boolean exists = taskRepository.existsById(savedTask.getId());
        boolean notExists = taskRepository.existsById(999L);

        assertThat(exists).isTrue();
        assertThat(notExists).isFalse();
    }

    @Test
    @DisplayName("Should validate required fields")
    void validation_RequiredFields() {
        Task invalidTask = Task.builder()
                .description("Missing title")
                .status(Task.TaskStatus.BACKLOG)
                .priority(Task.TaskPriority.MEDIUM)
                .build();

        assertThatThrownBy(() -> {
            entityManager.persistAndFlush(invalidTask);
        }).isInstanceOf(Exception.class); // Will throw validation or constraint violation
    }

    @Test
    @DisplayName("Should enforce field length constraints")
    void validation_FieldLengthConstraints() {
        String longTitle = "A".repeat(201);
        Task invalidTask = Task.builder()
                .title(longTitle)
                .description("Valid description")
                .status(Task.TaskStatus.BACKLOG)
                .priority(Task.TaskPriority.MEDIUM)
                .build();

        assertThatThrownBy(() -> {
            entityManager.persistAndFlush(invalidTask);
        }).isInstanceOf(Exception.class); // Will throw constraint violation
    }
}