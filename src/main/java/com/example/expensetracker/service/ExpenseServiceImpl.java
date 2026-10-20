package com.example.expensetracker.service;

import com.example.expensetracker.dto.ExpenseRequest;
import com.example.expensetracker.dto.ExpenseSummary;
import com.example.expensetracker.exception.ResourceNotFoundException;
import com.example.expensetracker.model.Expense;
import com.example.expensetracker.repository.ExpenseRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Implementation of ExpenseService handling core business logic.
 * 
 * Annotated with @Service so Spring's dependency injection container
 * automatically instantiates and wires it into controllers.
 */
@Service
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;

    // In-memory configurable monthly salary (defaults to ₹50,000.00)
    private final AtomicReference<BigDecimal> monthlySalary = new AtomicReference<>(new BigDecimal("50000.00"));

    // Spring automatically injects the ExpenseRepository bean via constructor injection
    public ExpenseServiceImpl(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    @Override
    public List<Expense> getAllExpenses(String category) {
        if (category == null || category.trim().isEmpty() || "All".equalsIgnoreCase(category.trim())) {
            return expenseRepository.findAll();
        }
        return expenseRepository.findByCategory(category.trim());
    }

    @Override
    public Expense getExpenseById(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found with ID: " + id));
    }

    @Override
    public Expense createExpense(ExpenseRequest request) {
        // Extra server-side safety checks
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be strictly greater than zero");
        }

        Expense expense = new Expense();
        expense.setDescription(request.getDescription().trim());
        // Set scale to 2 decimal places for consistent currency handling
        expense.setAmount(request.getAmount().setScale(2, RoundingMode.HALF_UP));
        expense.setCategory(request.getCategory().trim());
        expense.setDate(request.getDate());
        expense.setCreatedAt(LocalDateTime.now());

        return expenseRepository.save(expense);
    }

    @Override
    public void deleteExpense(Long id) {
        boolean removed = expenseRepository.deleteById(id);
        if (!removed) {
            throw new ResourceNotFoundException("Expense not found with ID: " + id);
        }
    }

    @Override
    public BigDecimal getMonthlySalary() {
        return monthlySalary.get();
    }

    @Override
    public BigDecimal updateMonthlySalary(BigDecimal salary) {
        if (salary == null || salary.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Monthly salary must be strictly greater than zero");
        }
        BigDecimal scaled = salary.setScale(2, RoundingMode.HALF_UP);
        monthlySalary.set(scaled);
        return scaled;
    }

    @Override
    public ExpenseSummary getSummary() {
        List<Expense> allExpenses = expenseRepository.findAll();
        LocalDate today = LocalDate.now();

        BigDecimal total = BigDecimal.ZERO;
        BigDecimal todayTotal = BigDecimal.ZERO;
        BigDecimal thisMonthTotal = BigDecimal.ZERO;

        Map<String, BigDecimal> categoryBreakdown = new LinkedHashMap<>();

        for (Expense e : allExpenses) {
            BigDecimal amt = e.getAmount() != null ? e.getAmount() : BigDecimal.ZERO;

            // Add to grand total
            total = total.add(amt);

            // Today's expenses
            if (e.getDate() != null && e.getDate().equals(today)) {
                todayTotal = todayTotal.add(amt);
            }

            // Current month's expenses
            if (e.getDate() != null &&
                    e.getDate().getYear() == today.getYear() &&
                    e.getDate().getMonth() == today.getMonth()) {
                thisMonthTotal = thisMonthTotal.add(amt);
            }

            // Category breakdown
            String cat = (e.getCategory() != null && !e.getCategory().trim().isEmpty())
                    ? e.getCategory().trim()
                    : "Uncategorized";
            categoryBreakdown.put(cat, categoryBreakdown.getOrDefault(cat, BigDecimal.ZERO).add(amt));
        }

        // Calculate category percentages relative to total spending
        Map<String, Double> categoryPercentages = new LinkedHashMap<>();
        if (total.compareTo(BigDecimal.ZERO) > 0) {
            for (Map.Entry<String, BigDecimal> entry : categoryBreakdown.entrySet()) {
                double pct = entry.getValue()
                        .multiply(BigDecimal.valueOf(100))
                        .divide(total, 1, RoundingMode.HALF_UP)
                        .doubleValue();
                categoryPercentages.put(entry.getKey(), pct);
            }
        }

        // Salary calculations
        BigDecimal currentSalary = getMonthlySalary();
        BigDecimal remainingSalary = currentSalary.subtract(thisMonthTotal).setScale(2, RoundingMode.HALF_UP);
        double salarySpentPct = 0.0;
        if (currentSalary.compareTo(BigDecimal.ZERO) > 0) {
            salarySpentPct = thisMonthTotal.multiply(BigDecimal.valueOf(100))
                    .divide(currentSalary, 1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        return new ExpenseSummary(
                total.setScale(2, RoundingMode.HALF_UP),
                todayTotal.setScale(2, RoundingMode.HALF_UP),
                thisMonthTotal.setScale(2, RoundingMode.HALF_UP),
                currentSalary,
                remainingSalary,
                salarySpentPct,
                allExpenses.size(),
                categoryBreakdown,
                categoryPercentages
        );
    }
}
