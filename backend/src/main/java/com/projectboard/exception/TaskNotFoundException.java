package com.projectboard.exception;

/**
 * Exception thrown when a task is not found
 */
public class TaskNotFoundException extends RuntimeException {
    
    public TaskNotFoundException(String message) {
        super(message);
    }
    
    public TaskNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
} 