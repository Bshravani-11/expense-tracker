package com.example.expensetracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main entry point for the Expense Tracker Spring Boot application.
 * 
 * @SpringBootApplication enables:
 * 1. @Configuration: Tags the class as a source of bean definitions for the application context.
 * 2. @EnableAutoConfiguration: Tells Spring Boot to start adding beans based on classpath settings.
 * 3. @ComponentScan: Tells Spring to look for other components, configurations, and services
 *    in the 'com.example.expensetracker' package.
 */
@SpringBootApplication
public class ExpenseTrackerApplication {

    public static void main(String[] args) {
        SpringApplication.run(ExpenseTrackerApplication.class, args);
        System.out.println("=================================================");
        System.out.println(" Expense Tracker Application is running!");
        System.out.println(" Open your browser: http://localhost:8080");
        System.out.println(" API Base URL:       http://localhost:8080/api/expenses");
        System.out.println(" (Note: Running in-memory; data resets on restart)");
        System.out.println("=================================================");
    }
}
