package com.example.expensetracker.service;

import com.example.expensetracker.dto.ExpenseRequest;
import com.example.expensetracker.dto.ExpenseSummary;
import com.example.expensetracker.model.Expense;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service interface specifying the business logic operations for Expenses.
 * 
 * In a layered architecture, the Service layer encapsulates business rules,
 * calculations, and validations, keeping controllers thin and focused on HTTP.
 */
public interface ExpenseService {

    /**
     * Get all expenses, optionally filtered by a specific category.
     * @param category category name or null/empty to return all
     */
    List<Expense> getAllExpenses(String category);

    /**
     * Find a single expense by ID, or throw ResourceNotFoundException.
     */
    Expense getExpenseById(Long id);

    /**
     * Validate and create a new expense.
     */
    Expense createExpense(ExpenseRequest request);

    /**
     * Delete an expense by ID, or throw ResourceNotFoundException if absent.
     */
    void deleteExpense(Long id);

    /**
     * Compute dashboard statistics:
     * - Total expenses
     * - Today's expenses
     * - This month's expenses
     * - Monthly salary & remaining savings
     * - Category breakdown
     */
    ExpenseSummary getSummary();

    /**
     * Get current configured monthly salary.
     */
    BigDecimal getMonthlySalary();

    /**
     * Update configured monthly salary.
     */
    BigDecimal updateMonthlySalary(BigDecimal salary);
}
