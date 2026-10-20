package com.example.expensetracker.repository;

import com.example.expensetracker.model.Expense;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/**
 * In-Memory Implementation of ExpenseRepository.
 * 
 * ============================================================================
 * NOTE ON DATA PERSISTENCE:
 * This repository keeps all expense records in RAM using a ConcurrentHashMap.
 * Because no persistent database (like MySQL or PostgreSQL) is attached yet,
 * ANY DATA ADDED OR MODIFIED WILL RESET TO DEFAULT WHEN THE SERVER RESTARTS.
 * ============================================================================
 * 
 * Thread Safety:
 * - ConcurrentHashMap ensures thread-safe reads and writes.
 * - AtomicLong ensures thread-safe, incrementing primary keys (IDs).
 */
@Repository
public class InMemoryExpenseRepository implements ExpenseRepository {

    // Thread-safe map storing expenses by ID in memory
    private final Map<Long, Expense> storage = new ConcurrentHashMap<>();

    // Thread-safe sequential ID generator
    private final AtomicLong idGenerator = new AtomicLong(1);

    /**
     * Seeds initial demo data on application startup.
     * Beginners can immediately see dashboard metrics, category breakdowns,
     * and transactions without having to type manually first.
     * All items can be deleted to test empty-state handling.
     */
    @PostConstruct
    public void initSampleData() {
        LocalDate today = LocalDate.now();

        save(new Expense(
                null,
                "Weekly Grocery Shopping",
                new BigDecimal("1450.00"),
                "Food & Dining",
                today,
                LocalDateTime.now().minusHours(2)
        ));

        save(new Expense(
                null,
                "Metro Smart Card Recharge",
                new BigDecimal("500.00"),
                "Transportation",
                today.minusDays(1),
                LocalDateTime.now().minusDays(1)
        ));

        save(new Expense(
                null,
                "Broadband Internet Bill",
                new BigDecimal("999.00"),
                "Bills & Utilities",
                today.minusDays(4),
                LocalDateTime.now().minusDays(4)
        ));

        save(new Expense(
                null,
                "New Wireless Headphones",
                new BigDecimal("2299.00"),
                "Shopping",
                today.minusDays(6),
                LocalDateTime.now().minusDays(6)
        ));
    }

    @Override
    public List<Expense> findAll() {
        return storage.values().stream()
                // Sort by date descending (newest expenses first), then by ID descending
                .sorted(Comparator.comparing(Expense::getDate, Comparator.reverseOrder())
                        .thenComparing(Expense::getId, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Expense> findById(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(storage.get(id));
    }

    @Override
    public Expense save(Expense expense) {
        if (expense.getId() == null) {
            // Assign next unique ID
            expense.setId(idGenerator.getAndIncrement());
        }
        if (expense.getCreatedAt() == null) {
            expense.setCreatedAt(LocalDateTime.now());
        }
        storage.put(expense.getId(), expense);
        return expense;
    }

    @Override
    public boolean deleteById(Long id) {
        if (id == null) {
            return false;
        }
        return storage.remove(id) != null;
    }

    @Override
    public List<Expense> findByCategory(String category) {
        if (category == null || category.trim().isEmpty() || "All".equalsIgnoreCase(category.trim())) {
            return findAll();
        }
        return storage.values().stream()
                .filter(e -> e.getCategory() != null && e.getCategory().equalsIgnoreCase(category.trim()))
                .sorted(Comparator.comparing(Expense::getDate, Comparator.reverseOrder())
                        .thenComparing(Expense::getId, Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public void clear() {
        storage.clear();
    }
}
