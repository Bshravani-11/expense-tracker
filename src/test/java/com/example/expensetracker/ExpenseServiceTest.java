package com.example.expensetracker;

import com.example.expensetracker.dto.ExpenseRequest;
import com.example.expensetracker.dto.ExpenseSummary;
import com.example.expensetracker.exception.ResourceNotFoundException;
import com.example.expensetracker.model.Expense;
import com.example.expensetracker.repository.InMemoryExpenseRepository;
import com.example.expensetracker.service.ExpenseServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ExpenseServiceTest {

    private InMemoryExpenseRepository repository;
    private ExpenseServiceImpl service;

    @BeforeEach
    void setUp() {
        repository = new InMemoryExpenseRepository();
        // Clear demo data to test from a clean slate
        repository.clear();
        service = new ExpenseServiceImpl(repository);
    }

    @Test
    void testCreateExpense_Success() {
        ExpenseRequest request = new ExpenseRequest(
                "Coffee and Snacks",
                new BigDecimal("150.00"),
                "Food & Dining",
                LocalDate.now()
        );

        Expense created = service.createExpense(request);

        assertNotNull(created.getId());
        assertEquals("Coffee and Snacks", created.getDescription());
        assertEquals(new BigDecimal("150.00"), created.getAmount());
        assertEquals("Food & Dining", created.getCategory());
        assertEquals(LocalDate.now(), created.getDate());
        assertNotNull(created.getCreatedAt());
    }

    @Test
    void testCreateExpense_NegativeOrZeroAmount_ThrowsException() {
        ExpenseRequest zeroReq = new ExpenseRequest("Invalid", BigDecimal.ZERO, "Other", LocalDate.now());
        assertThrows(IllegalArgumentException.class, () -> service.createExpense(zeroReq));

        ExpenseRequest negReq = new ExpenseRequest("Invalid", new BigDecimal("-50.00"), "Other", LocalDate.now());
        assertThrows(IllegalArgumentException.class, () -> service.createExpense(negReq));
    }

    @Test
    void testDeleteExpense_Success() {
        Expense created = service.createExpense(new ExpenseRequest("Bus fare", new BigDecimal("40.00"), "Transportation", LocalDate.now()));
        assertNotNull(created.getId());

        service.deleteExpense(created.getId());

        assertThrows(ResourceNotFoundException.class, () -> service.getExpenseById(created.getId()));
    }

    @Test
    void testDeleteExpense_NotFound_ThrowsException() {
        assertThrows(ResourceNotFoundException.class, () -> service.deleteExpense(99999L));
    }

    @Test
    void testCategoryFilter() {
        service.createExpense(new ExpenseRequest("Lunch", new BigDecimal("200.00"), "Food & Dining", LocalDate.now()));
        service.createExpense(new ExpenseRequest("Dinner", new BigDecimal("350.00"), "Food & Dining", LocalDate.now()));
        service.createExpense(new ExpenseRequest("Train ticket", new BigDecimal("120.00"), "Transportation", LocalDate.now()));

        List<Expense> foodList = service.getAllExpenses("Food & Dining");
        assertEquals(2, foodList.size());

        List<Expense> transportList = service.getAllExpenses("Transportation");
        assertEquals(1, transportList.size());

        List<Expense> allList = service.getAllExpenses("All");
        assertEquals(3, allList.size());
    }

    @Test
    void testSummaryCalculation() {
        LocalDate today = LocalDate.now();
        service.createExpense(new ExpenseRequest("Item 1", new BigDecimal("500.00"), "Shopping", today));
        service.createExpense(new ExpenseRequest("Item 2", new BigDecimal("300.00"), "Food & Dining", today));

        ExpenseSummary summary = service.getSummary();

        assertEquals(new BigDecimal("800.00"), summary.getTotalExpenses());
        assertEquals(new BigDecimal("800.00"), summary.getTodayExpenses());
        assertEquals(new BigDecimal("800.00"), summary.getThisMonthExpenses());
        assertEquals(2, summary.getTotalTransactions());
        assertEquals(new BigDecimal("500.00"), summary.getCategoryBreakdown().get("Shopping"));
        assertEquals(new BigDecimal("300.00"), summary.getCategoryBreakdown().get("Food & Dining"));

        // Default salary is 50,000.00, remaining should be 50,000 - 800 = 49,200.00
        assertEquals(new BigDecimal("50000.00"), summary.getMonthlySalary());
        assertEquals(new BigDecimal("49200.00"), summary.getRemainingSalary());
        assertEquals(1.6, summary.getSalarySpentPercentage());
    }

    @Test
    void testMonthlySalary_GetAndUpdate() {
        assertEquals(new BigDecimal("50000.00"), service.getMonthlySalary());

        BigDecimal updated = service.updateMonthlySalary(new BigDecimal("75000.00"));
        assertEquals(new BigDecimal("75000.00"), updated);
        assertEquals(new BigDecimal("75000.00"), service.getMonthlySalary());

        // Test invalid salary
        assertThrows(IllegalArgumentException.class, () -> service.updateMonthlySalary(BigDecimal.ZERO));
        assertThrows(IllegalArgumentException.class, () -> service.updateMonthlySalary(new BigDecimal("-1000")));
    }
}
