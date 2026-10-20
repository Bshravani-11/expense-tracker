package com.example.expensetracker.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Data Transfer Object (DTO) for creating a new Expense.
 * 
 * Using a DTO prevents client code from tampering with server-controlled
 * fields like 'id' or 'createdAt'. We also attach Jakarta Validation
 * annotations to automatically validate client inputs before processing.
 */
public class ExpenseRequest {

    @NotBlank(message = "Description is required")
    @Size(min = 2, max = 150, message = "Description must be between 2 and 150 characters")
    private String description;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be strictly greater than 0")
    @DecimalMin(value = "0.01", message = "Amount must be at least 0.01")
    private BigDecimal amount;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Date is required")
    private LocalDate date;

    public ExpenseRequest() {
    }

    public ExpenseRequest(String description, BigDecimal amount, String category, LocalDate date) {
        this.description = description;
        this.amount = amount;
        this.category = category;
        this.date = date;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }
}
