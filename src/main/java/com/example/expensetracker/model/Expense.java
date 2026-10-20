package com.example.expensetracker.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents a single Expense record in the application.
 * 
 * In Java / Spring Boot, a model class (also known as an Entity or POJO)
 * represents the data structure of the domain object we are tracking.
 */
public class Expense {

    // Unique identifier for the expense
    private Long id;

    // A short text describing what the expense was for (e.g. "Dinner with friends")
    private String description;

    // The monetary value of the expense in Indian Rupees (INR)
    // BigDecimal is used for financial calculations to prevent floating point inaccuracies
    private BigDecimal amount;

    // The spending category (e.g. Food, Travel, Utilities, Shopping)
    private String category;

    // The date when the expense actually occurred
    private LocalDate date;

    // Timestamp of when this expense was recorded in the system
    private LocalDateTime createdAt;

    // Default no-argument constructor (required by serialization frameworks like Jackson)
    public Expense() {
    }

    // Parameterized constructor to create an expense instance easily
    public Expense(Long id, String description, BigDecimal amount, String category, LocalDate date, LocalDateTime createdAt) {
        this.id = id;
        this.description = description;
        this.amount = amount;
        this.category = category;
        this.date = date;
        this.createdAt = createdAt;
    }

    // Getters and Setters allow other classes (and Spring's JSON serializer)
    // to read and write the private fields of this object.

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "Expense{" +
                "id=" + id +
                ", description='" + description + '\'' +
                ", amount=" + amount +
                ", category='" + category + '\'' +
                ", date=" + date +
                ", createdAt=" + createdAt +
                '}';
    }
}
