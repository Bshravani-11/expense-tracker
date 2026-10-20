package com.example.expensetracker.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.ArrayList;
import java.util.List;

/**
 * Controller Advice to catch and format exceptions across the entire application.
 * 
 * Instead of returning ugly stack traces or default error pages,
 * this class intercepts exceptions and converts them into structured,
 * easy-to-understand JSON responses.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles validation failures triggered by @Valid in controller methods.
     * Extracts individual field errors (e.g. "Amount must be strictly greater than 0").
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex) {
        List<String> errors = new ArrayList<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.add(error.getField() + ": " + error.getDefaultMessage());
        }

        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                "Validation failed for one or more fields",
                errors
        );

        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handles cases where a requested expense ID does not exist in the store.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        ErrorResponse response = new ErrorResponse(
                HttpStatus.NOT_FOUND.value(),
                ex.getMessage(),
                List.of(ex.getMessage())
        );
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    /**
     * Handles illegal arguments or invalid formats (e.g., malformed IDs or bad parameters).
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        ErrorResponse response = new ErrorResponse(
                HttpStatus.BAD_REQUEST.value(),
                ex.getMessage(),
                List.of(ex.getMessage())
        );
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    /**
     * Fallback handler for any unexpected server errors.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex) {
        ErrorResponse response = new ErrorResponse(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "An unexpected server error occurred: " + ex.getMessage(),
                List.of(ex.getMessage() != null ? ex.getMessage() : "Internal Server Error")
        );
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
