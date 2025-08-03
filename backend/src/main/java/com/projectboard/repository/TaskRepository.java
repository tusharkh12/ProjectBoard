package com.projectboard.repository;

import com.projectboard.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Task Repository with custom queries
 */
@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    /**
     * Find tasks by status
     */
    List<Task> findByStatus(Task.TaskStatus status);

    /**
     * Find tasks by priority
     */
    List<Task> findByPriority(Task.TaskPriority priority);

    /**
     * Find tasks by assignee
     */
    List<Task> findByAssigneeIgnoreCase(String assignee);

    /**
     * Search tasks by title or description (case-insensitive)
     */
    @Query("SELECT t FROM Task t WHERE " +
           "LOWER(t.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(t.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<Task> searchByTitleOrDescription(@Param("searchTerm") String searchTerm);

    /**
     * Find tasks by multiple criteria (flexible search)
     */
    @Query("SELECT t FROM Task t WHERE " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:assignee IS NULL OR LOWER(t.assignee) LIKE LOWER(CONCAT('%', :assignee, '%'))) AND " +
           "(:searchTerm IS NULL OR " +
           " LOWER(t.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           " LOWER(t.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<Task> findTasksByCriteria(@Param("status") Task.TaskStatus status,
                                   @Param("priority") Task.TaskPriority priority,
                                   @Param("assignee") String assignee,
                                   @Param("searchTerm") String searchTerm);
} 