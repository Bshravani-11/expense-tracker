package com.example.expensetracker.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

/**
 * DTO for updating the user's monthly salary.
 */
public class SalaryRequest {

    @NotNull(message = "Salary amount is required")
    @Positive(message = "Salary must be strictly greater than 0")
    @DecimalMin(value = "1.00", message = "Salary must be at least 1.00")
    private BigDecimal salary;

    public SalaryRequest() {
    }

    public SalaryRequest(BigDecimal salary) {
        this.salary = salary;
    }

    public BigDecimal getSalary() {
        return salary;
    }

    public void setSalary(BigDecimal salary) {
        this.salary = salary;
    }
}
