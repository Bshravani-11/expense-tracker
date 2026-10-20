package com.example.expensetracker;

import com.example.expensetracker.dto.ExpenseRequest;
import com.example.expensetracker.repository.ExpenseRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests verifying all REST API endpoints of ExpenseController.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ExpenseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ExpenseRepository expenseRepository;

    @BeforeEach
    void setUp() {
        // Reset repository state before each test
        expenseRepository.clear();
    }

    @Test
    void testGetAllExpenses_WhenEmpty() throws Exception {
        mockMvc.perform(get("/api/expenses"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void testCreateExpense_Success() throws Exception {
        ExpenseRequest request = new ExpenseRequest(
                "Dinner at Restaurant",
                new BigDecimal("650.00"),
                "Food & Dining",
                LocalDate.now()
        );

        mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.description", is("Dinner at Restaurant")))
                .andExpect(jsonPath("$.amount", is(650.00)))
                .andExpect(jsonPath("$.category", is("Food & Dining")));
    }

    @Test
    void testCreateExpense_InvalidAmount_ReturnsBadRequest() throws Exception {
        ExpenseRequest request = new ExpenseRequest(
                "Invalid Negative Expense",
                new BigDecimal("-100.00"),
                "Food & Dining",
                LocalDate.now()
        );

        mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.errors", notNullValue()));
    }

    @Test
    void testCreateExpense_MissingDescription_ReturnsBadRequest() throws Exception {
        ExpenseRequest request = new ExpenseRequest(
                "",
                new BigDecimal("100.00"),
                "Shopping",
                LocalDate.now()
        );

        mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)));
    }

    @Test
    void testDeleteExpense_Success() throws Exception {
        // First create an expense
        ExpenseRequest request = new ExpenseRequest(
                "Coffee",
                new BigDecimal("120.00"),
                "Food & Dining",
                LocalDate.now()
        );

        String responseContent = mockMvc.perform(post("/api/expenses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Long id = objectMapper.readTree(responseContent).get("id").asLong();

        // Delete it
        mockMvc.perform(delete("/api/expenses/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.deletedId", is(id.intValue())));

        // Verify it is gone
        mockMvc.perform(get("/api/expenses/" + id))
                .andExpect(status().isNotFound());
    }

    @Test
    void testDeleteExpense_NotFound() throws Exception {
        mockMvc.perform(delete("/api/expenses/99999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)));
    }

    @Test
    void testGetSummary() throws Exception {
        mockMvc.perform(post("/api/expenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        new ExpenseRequest("Lunch", new BigDecimal("250.00"), "Food & Dining", LocalDate.now())
                )));

        mockMvc.perform(get("/api/expenses/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalExpenses", is(250.00)))
                .andExpect(jsonPath("$.totalTransactions", is(1)))
                .andExpect(jsonPath("$.categoryBreakdown['Food & Dining']", is(250.00)))
                .andExpect(jsonPath("$.monthlySalary", is(50000.00)))
                .andExpect(jsonPath("$.remainingSalary", is(49750.00)));
    }

    @Test
    void testGetAndSetSalary() throws Exception {
        mockMvc.perform(get("/api/expenses/salary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.salary", is(50000.00)));

        mockMvc.perform(post("/api/expenses/salary")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"salary\": 65000.00}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.salary", is(65000.00)));

        mockMvc.perform(get("/api/expenses/salary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.salary", is(65000.00)));
    }
}
