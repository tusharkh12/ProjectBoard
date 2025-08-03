package com.projectboard.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Task Entity for ProjectBoard
 * 
 * Features:
 * - Optimistic Locking via @Version
 * - JPA Auditing for created/modified timestamps
 * - Validation constraints
 * - Support for parallel editing with conflict detection
 */
@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title cannot be empty")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    @Column(nullable = false, length = 200)
    private String title;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    @Column(nullable = true, length = 2000)
    private String description;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status;

    @NotNull(message = "Priority is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskPriority priority;

    @Size(max = 100, message = "Assignee name cannot exceed 100 characters")
    @Column(length = 100)
    private String assignee;

    @Column(name = "estimated_hours")
    private Double estimatedHours;

    @Size(max = 500, message = "Tags cannot exceed 500 characters")
    @Column(length = 500)
    private String tags;

    // Optimistic Locking - crucial for conflict detection
    @Version
    @Column(nullable = false)
    private Long version;

    // Audit fields
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Size(max = 100, message = "Created by cannot exceed 100 characters")
    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Size(max = 100, message = "Updated by cannot exceed 100 characters")
    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    /**
     * Task Status Enum
     */
    @Getter
    public enum TaskStatus {
        BACKLOG("Backlog"),
        IN_PROGRESS("In Progress"),
        REVIEW("In Review"),
        TESTING("Testing"),
        DONE("Done");

        private final String displayName;

        TaskStatus(String displayName) {
            this.displayName = displayName;
        }

    }

    /**
     * Task Priority Enum
     */
    @Getter
    public enum TaskPriority {
        LOW("Low", 1),
        MEDIUM("Medium", 2),
        HIGH("High",3),
        CRITICAL("Critical", 4);

        private final String displayName;
        private final int level;

        TaskPriority(String displayName, int level) {
            this.displayName = displayName;
            this.level = level;
        }

    }
} 