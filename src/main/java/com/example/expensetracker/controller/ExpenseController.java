package com.example.expensetracker.controller;

import com.example.expensetracker.dto.ExpenseRequest;
import com.example.expensetracker.dto.ExpenseSummary;
import com.example.expensetracker.dto.SalaryRequest;
import com.example.expensetracker.model.Expense;
import com.example.expensetracker.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for Expense and Salary Management.
 * 
 * Maps HTTP requests to service methods and returns data serialized into JSON.
 * Base route: /api/expenses
 */
@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = "*") // Allows frontends hosted on different ports/domains if needed
public class ExpenseController {

    private final ExpenseService expenseService;

    // Constructor injection: Spring provides the ExpenseService bean automatically
    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    /**
     * GET /api/expenses
     * Retrieves all expenses, or filters by category if the query param is supplied.
     * Example: GET /api/expenses?category=Food
     */
    @GetMapping
    public ResponseEntity<List<Expense>> getExpenses(
            @RequestParam(required = false) String category) {
        List<Expense> expenses = expenseService.getAllExpenses(category);
        return ResponseEntity.ok(expenses);
    }

    /**
     * GET /api/expenses/{id}
     * Retrieves a single expense by its ID.
     */
    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<Expense> getExpenseById(@PathVariable Long id) {
        Expense expense = expenseService.getExpenseById(id);
        return ResponseEntity.ok(expense);
    }

    /**
     * POST /api/expenses
     * Creates a new expense record after validating incoming data.
     * Returns HTTP 201 Created on success, or HTTP 400 Bad Request if validation fails.
     */
    @PostMapping
    public ResponseEntity<Expense> createExpense(@Valid @RequestBody ExpenseRequest request) {
        Expense created = expenseService.createExpense(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /**
     * DELETE /api/expenses/{id}
     * Deletes an expense by ID.
     * Returns HTTP 200 with confirmation message, or HTTP 404 if not found.
     */
    @DeleteMapping("/{id:[0-9]+}")
    public ResponseEntity<Map<String, Object>> deleteExpense(@PathVariable Long id) {
        expenseService.deleteExpense(id);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Expense with ID " + id + " was deleted successfully");
        response.put("deletedId", id);

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/expenses/summary
     * Computes and returns high-level dashboard metrics:
     * - Total expenses
     * - Today's expenses
     * - This month's expenses
     * - Monthly salary & remaining savings
     * - Category-wise breakdown
     */
    @GetMapping("/summary")
    public ResponseEntity<ExpenseSummary> getSummary() {
        ExpenseSummary summary = expenseService.getSummary();
        return ResponseEntity.ok(summary);
    }

    /**
     * GET /api/expenses/salary
     * Returns the currently configured monthly salary.
     */
    @GetMapping("/salary")
    public ResponseEntity<Map<String, BigDecimal>> getSalary() {
        BigDecimal salary = expenseService.getMonthlySalary();
        return ResponseEntity.ok(Map.of("salary", salary));
    }

    /**
     * PUT/POST /api/expenses/salary
     * Updates the user's monthly salary.
     */
    @RequestMapping(value = "/salary", method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<Map<String, Object>> updateSalary(@Valid @RequestBody SalaryRequest request) {
        BigDecimal updated = expenseService.updateMonthlySalary(request.getSalary());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("salary", updated);
        response.put("message", "Monthly salary updated successfully");
        return ResponseEntity.ok(response);
    }
}
