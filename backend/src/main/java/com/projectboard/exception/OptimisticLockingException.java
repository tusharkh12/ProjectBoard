package com.projectboard.exception;

import com.projectboard.dto.TaskDTO;
import lombok.Getter;

/**
 * Exception thrown when optimistic locking conflict is detected
 * Provides detailed information for conflict resolution in the frontend
 */
@Getter
public class OptimisticLockingException extends RuntimeException {
    
    private final Long currentVersion;
    private final Long attemptedVersion;
    private final TaskDTO.Response currentTaskData;

    public OptimisticLockingException(String message, Long currentVersion, Long attemptedVersion, TaskDTO.Response currentTaskData) {
        super(message);
        this.currentVersion = currentVersion;
        this.attemptedVersion = attemptedVersion;
        this.currentTaskData = currentTaskData;
    }
} 