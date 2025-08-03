package com.projectboard.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for the application
 * Handles all exceptions and provides consistent error responses
 */
@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handle TaskNotFoundException
     */
    @ExceptionHandler(TaskNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleTaskNotFoundException(
            TaskNotFoundException ex, WebRequest request) {
        log.warn("Task not found: {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.NOT_FOUND.value());
        errorResponse.put("error", "NOT_FOUND");
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("path", request.getDescription(false).replace("uri=", ""));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    /**
     * Handle OptimisticLockingException
     */
    @ExceptionHandler(OptimisticLockingException.class)
    public ResponseEntity<Map<String, Object>> handleOptimisticLockingException(
            OptimisticLockingException ex, WebRequest request) {
        log.warn("Optimistic locking conflict: {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.CONFLICT.value());
        errorResponse.put("error", "OPTIMISTIC_LOCK_CONFLICT");
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("currentVersion", ex.getCurrentVersion());
        errorResponse.put("attemptedVersion", ex.getAttemptedVersion());
        errorResponse.put("currentData", ex.getCurrentTaskData());
        errorResponse.put("path", request.getDescription(false).replace("uri=", ""));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    /**
     * Handle JPA OptimisticLockingFailureException
     */
    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<Map<String, Object>> handleJpaOptimisticLockingFailure(
            OptimisticLockingFailureException ex, WebRequest request) {
        log.warn("JPA Optimistic locking failure: {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.CONFLICT.value());
        errorResponse.put("error", "OPTIMISTIC_LOCK_CONFLICT");
        errorResponse.put("message", "The resource was modified by another user. Please refresh and try again.");
        errorResponse.put("path", request.getDescription(false).replace("uri=", ""));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.CONFLICT);
    }

    /**
     * Handle validation errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(
            MethodArgumentNotValidException ex, WebRequest request) {
        log.warn("Validation error: {}", ex.getMessage());
        
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            fieldErrors.put(fieldName, errorMessage);
        });
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
        errorResponse.put("error", "VALIDATION_FAILED");
        errorResponse.put("message", "Validation failed for request");
        errorResponse.put("fieldErrors", fieldErrors);
        errorResponse.put("path", request.getDescription(false).replace("uri=", ""));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle IllegalArgumentException
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(
            IllegalArgumentException ex, WebRequest request) {
        log.warn("Illegal argument: {}", ex.getMessage());
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.BAD_REQUEST.value());
        errorResponse.put("error", "BAD_REQUEST");
        errorResponse.put("message", ex.getMessage());
        errorResponse.put("path", request.getDescription(false).replace("uri=", ""));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle all other exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGlobalException(
            Exception ex, WebRequest request) {
        log.error("Unexpected error occurred: ", ex);
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", LocalDateTime.now());
        errorResponse.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        errorResponse.put("error", "INTERNAL_SERVER_ERROR");
        errorResponse.put("message", "An unexpected error occurred. Please try again later.");
        errorResponse.put("path", request.getDescription(false).replace("uri=", ""));
        
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}