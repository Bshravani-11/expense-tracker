package com.example.expensetracker.dto;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Summary DTO containing computed metrics for the dashboard:
 * - Overall total spending
 * - Today's spending
 * - Current month's spending
 * - Monthly salary and remaining savings
 * - Total count of transactions
 * - Category-wise totals and percentages
 */
public class ExpenseSummary {

    private BigDecimal totalExpenses;
    private BigDecimal todayExpenses;
    private BigDecimal thisMonthExpenses;
    private BigDecimal monthlySalary;
    private BigDecimal remainingSalary;
    private Double salarySpentPercentage;
    private long totalTransactions;
    private Map<String, BigDecimal> categoryBreakdown;
    private Map<String, Double> categoryPercentages;

    public ExpenseSummary() {
    }

    public ExpenseSummary(BigDecimal totalExpenses,
                          BigDecimal todayExpenses,
                          BigDecimal thisMonthExpenses,
                          BigDecimal monthlySalary,
                          BigDecimal remainingSalary,
                          Double salarySpentPercentage,
                          long totalTransactions,
                          Map<String, BigDecimal> categoryBreakdown,
                          Map<String, Double> categoryPercentages) {
        this.totalExpenses = totalExpenses;
        this.todayExpenses = todayExpenses;
        this.thisMonthExpenses = thisMonthExpenses;
        this.monthlySalary = monthlySalary;
        this.remainingSalary = remainingSalary;
        this.salarySpentPercentage = salarySpentPercentage;
        this.totalTransactions = totalTransactions;
        this.categoryBreakdown = categoryBreakdown;
        this.categoryPercentages = categoryPercentages;
    }

    public BigDecimal getTotalExpenses() {
        return totalExpenses;
    }

    public void setTotalExpenses(BigDecimal totalExpenses) {
        this.totalExpenses = totalExpenses;
    }

    public BigDecimal getTodayExpenses() {
        return todayExpenses;
    }

    public void setTodayExpenses(BigDecimal todayExpenses) {
        this.todayExpenses = todayExpenses;
    }

    public BigDecimal getThisMonthExpenses() {
        return thisMonthExpenses;
    }

    public void setThisMonthExpenses(BigDecimal thisMonthExpenses) {
        this.thisMonthExpenses = thisMonthExpenses;
    }

    public BigDecimal getMonthlySalary() {
        return monthlySalary;
    }

    public void setMonthlySalary(BigDecimal monthlySalary) {
        this.monthlySalary = monthlySalary;
    }

    public BigDecimal getRemainingSalary() {
        return remainingSalary;
    }

    public void setRemainingSalary(BigDecimal remainingSalary) {
        this.remainingSalary = remainingSalary;
    }

    public Double getSalarySpentPercentage() {
        return salarySpentPercentage;
    }

    public void setSalarySpentPercentage(Double salarySpentPercentage) {
        this.salarySpentPercentage = salarySpentPercentage;
    }

    public long getTotalTransactions() {
        return totalTransactions;
    }

    public void setTotalTransactions(long totalTransactions) {
        this.totalTransactions = totalTransactions;
    }

    public Map<String, BigDecimal> getCategoryBreakdown() {
        return categoryBreakdown;
    }

    public void setCategoryBreakdown(Map<String, BigDecimal> categoryBreakdown) {
        this.categoryBreakdown = categoryBreakdown;
    }

    public Map<String, Double> getCategoryPercentages() {
        return categoryPercentages;
    }

    public void setCategoryPercentages(Map<String, Double> categoryPercentages) {
        this.categoryPercentages = categoryPercentages;
    }
}
