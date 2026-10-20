package com.example.expensetracker.repository;

import com.example.expensetracker.model.Expense;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface defining operations for storing, retrieving,
 * and deleting Expense objects.
 * 
 * Separating the interface from the implementation allows us to easily switch
 * from an in-memory store to a database (like H2, PostgreSQL, or MySQL) later
 * without altering service or controller code.
 */
public interface ExpenseRepository {

    /**
     * Retrieve all recorded expenses, ordered by date descending.
     */
    List<Expense> findAll();

    /**
     * Find a single expense by its unique identifier.
     */
    Optional<Expense> findById(Long id);

    /**
     * Save an expense (insert if new or update if already present).
     */
    Expense save(Expense expense);

    /**
     * Delete an expense by its unique ID.
     * Returns true if found and removed, false otherwise.
     */
    boolean deleteById(Long id);

    /**
     * Find expenses that match a specific category (case-insensitive).
     */
    List<Expense> findByCategory(String category);

    /**
     * Delete all expenses (helpful for testing or resetting).
     */
    void clear();
}
