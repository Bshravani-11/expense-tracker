# 💰 Expense Tracker Web Application

A beginner-friendly, full-stack **Expense Tracker** web application built with **Java Spring Boot** and vanilla **HTML, CSS, and JavaScript**. 

The application serves both the interactive single-page dashboard and the REST API from a single Spring Boot service running on **`http://localhost:8080`**, with all monetary values formatted in **Indian Rupees (INR ₹)**.

---

> [!IMPORTANT]
> **In-Memory Data Store Notice:**  
> This application currently uses an **in-memory storage engine** (`ConcurrentHashMap`). All expenses added, edited, or deleted persist in RAM while the server is active. **When you stop or restart the application, the data resets back to the initial sample state.**

---

## ✨ Features

1. **Modern, Responsive Dashboard** — Clean, card-based layout optimized for desktops, tablets, and mobile screens.
2. **Monthly Salary & Savings Tracker** — Set your monthly salary/income, track how much of your salary has been spent this month, monitor remaining savings balance, and view a visual budget utilization meter (with color-coded alerts: On Track, Caution, Over Budget).
3. **Key Metric Cards**:
   - **Total Expenses** (₹) with total transaction count.
   - **Today's Expenses** (₹) with dynamic date detection.
   - **This Month's Expenses** (₹) tracking current month's spending.
   - **Top Category** highlighting the category with the highest spend.
4. **Add Expense** — Record expenses with Amount (₹), Category, Date, and Description via either:
   - The **Sidebar Quick Add form** for rapid data entry.
   - The **Add Expense Modal** dialog.
5. **Transaction Table** — Displays recorded transactions sorted by date, featuring category badges, formatted dates, and amounts in INR.
6. **Delete Transactions** — Remove unwanted expenses with a safety confirmation dialog.
7. **Filter by Category** — Instantly filter transactions by category (Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities, Healthcare, Education, Other).
8. **Category Summary & Visual Meter** — Visual proportion bar and progress meters displaying exact spending amount and percentage per category.
9. **Input Validation** — Strict validation on both frontend and backend (positive amounts, required fields, character limits) with helpful inline error alerts.
10. **Helpful Empty State** — When no expenses are present or when a filter matches zero records, a friendly empty-state illustration and prompt appear.
11. **Indian Rupee (INR ₹) Formatting** — Full support for Indian number formatting (e.g. `₹1,45,000.00`).

---

## 🛠️ Technologies Used

- **Backend**: Java 17+ (tested with Java 21 LTS), Spring Boot 3.3.4
  - `spring-boot-starter-web`: REST controllers, static resource server, embedded Tomcat.
  - `spring-boot-starter-validation`: Jakarta Bean Validation (`@Valid`, `@Positive`, `@NotBlank`, `@NotNull`).
  - `spring-boot-starter-test`: JUnit 5, MockMvc for unit and integration testing.
- **Frontend**: Vanilla HTML5, CSS3 (CSS Variables, Flexbox, Grid), JavaScript (ES6+ `fetch()` API, `Intl.NumberFormat`).
- **Build Tool**: Apache Maven (Maven Wrapper `mvnw.cmd` included).
- **Data Store**: Thread-safe in-memory store (`ConcurrentHashMap` + `AtomicLong`).

---

## 📁 Project Structure

```text
expense-tracker/
├── .mvn/wrapper/                  # Maven Wrapper configuration and JAR
│   ├── maven-wrapper.jar
│   └── maven-wrapper.properties
├── src/
│   ├── main/
│   │   ├── java/com/example/expensetracker/
│   │   │   ├── ExpenseTrackerApplication.java      # Application entry point
│   │   │   ├── controller/
│   │   │   │   └── ExpenseController.java          # REST API endpoints (/api/expenses)
│   │   │   ├── dto/
│   │   │   │   ├── ExpenseRequest.java             # Incoming request validation DTO
│   │   │   │   └── ExpenseSummary.java             # Dashboard metrics summary DTO
│   │   │   ├── exception/
│   │   │   │   ├── ErrorResponse.java              # Structured JSON error response
│   │   │   │   ├── GlobalExceptionHandler.java     # @RestControllerAdvice handler
│   │   │   │   └── ResourceNotFoundException.java  # 404 Not Found exception
│   │   │   ├── model/
│   │   │   │   └── Expense.java                    # Expense entity domain model
│   │   │   ├── repository/
│   │   │   │   ├── ExpenseRepository.java          # Storage interface
│   │   │   │   └── InMemoryExpenseRepository.java  # In-memory ConcurrentHashMap store
│   │   │   └── service/
│   │   │       ├── ExpenseService.java             # Business logic interface
│   │   │       └── ExpenseServiceImpl.java         # Business logic implementation
│   │   └── resources/
│   │       ├── application.properties              # Port and configuration settings
│   │       └── static/                             # Frontend served automatically
│   │           ├── index.html                      # Single page application markup
│   │           ├── css/
│   │           │   └── style.css                   # Custom styles, badges, responsive layout
│   │           └── js/
│   │               └── script.js                   # REST API fetch calls, DOM rendering
│   └── test/
│       └── java/com/example/expensetracker/
│           ├── ExpenseTrackerApplicationTests.java # Context loading test
│           ├── ExpenseServiceTest.java             # Unit tests for business logic
│           └── ExpenseControllerTest.java          # MockMvc integration tests for REST API
├── mvnw                                            # Maven wrapper script for Linux/macOS
├── mvnw.cmd                                        # Maven wrapper script for Windows
├── pom.xml                                         # Maven dependencies & build configuration
└── README.md                                       # Documentation & running instructions
```

---

## 🚀 How to Run on Windows

### Prerequisites
- **Java 17 or higher** installed.  
  To verify your Java installation, open **PowerShell** or **Command Prompt** and run:
  ```powershell
  java -version
  ```
  *(If Java is installed, you will see output like `openjdk version "21..."` or `java version "17..."`)*

---

### Method 1: Run with Maven Wrapper (Recommended — No Maven installation required!)

Open PowerShell or Command Prompt in the project directory (`c:\Users\LENOVO\Downloads\expense tracker`), and run:

```powershell
.\mvnw.cmd spring-boot:run
```

The script will automatically detect your Java installation, compile the code, and launch the embedded Tomcat server.

---

### Method 2: Run the Packaged JAR

If you prefer to run the compiled standalone JAR file directly:

1. Build the JAR (already packaged in `target/`):
   ```powershell
   .\mvnw.cmd package -DskipTests
   ```
2. Run the JAR using Java:
   ```powershell
   java -jar target\expense-tracker-1.0.0.jar
   ```

---

### Method 3: Run with Globally Installed Maven (if `mvn` is on PATH)

```powershell
mvn spring-boot:run
```

---

### 🌐 Accessing the Application

Once the server has started, open your web browser and navigate to:

👉 **[http://localhost:8080](http://localhost:8080)**

---

## 🧪 Running Automated Tests

The application includes unit tests and full MockMvc REST API integration tests. Run all tests with:

```powershell
.\mvnw.cmd test
```

Expected output:
```text
[INFO] Results:
[INFO] Tests run: 16, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

---

## 📡 REST API Documentation

Base URL: `http://localhost:8080/api/expenses`

| Method | Endpoint | Description | Request Body | Status Code |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/expenses` | Get all expenses | *None* | `200 OK` |
| **GET** | `/api/expenses?category=Food%20%26%20Dining` | Filter expenses by category | *None* | `200 OK` |
| **GET** | `/api/expenses/{id}` | Get a single expense by ID | *None* | `200 OK` / `404 Not Found` |
| **GET** | `/api/expenses/summary` | Get summary metrics, salary & category totals | *None* | `200 OK` |
| **GET** | `/api/expenses/salary` | Get currently configured monthly salary | *None* | `200 OK` |
| **POST** | `/api/expenses/salary` | Update monthly salary amount | `{"salary": 60000.00}` | `200 OK` / `400 Bad Request` |
| **POST** | `/api/expenses` | Add a new expense | JSON object | `201 Created` / `400 Bad Request` |
| **DELETE** | `/api/expenses/{id}` | Delete an expense by ID | *None* | `200 OK` / `404 Not Found` |

### Sample `POST /api/expenses` Request Body
```json
{
  "description": "Monthly Grocery Shopping",
  "amount": 1450.00,
  "category": "Food & Dining",
  "date": "2026-10-19"
}
```

### Sample `POST` curl Command (PowerShell):
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/api/expenses" -Method Post -ContentType "application/json" -Body '{"description":"Metro Pass","amount":500.00,"category":"Transportation","date":"2026-10-19"}'
```

### Sample `GET /api/expenses/summary` Response
```json
{
  "totalExpenses": 5248.00,
  "todayExpenses": 1450.00,
  "thisMonthExpenses": 5248.00,
  "totalTransactions": 4,
  "categoryBreakdown": {
    "Food & Dining": 1450.00,
    "Transportation": 500.00,
    "Bills & Utilities": 999.00,
    "Shopping": 2299.00
  },
  "categoryPercentages": {
    "Food & Dining": 27.6,
    "Transportation": 9.5,
    "Bills & Utilities": 19.0,
    "Shopping": 43.8
  }
}
```

---

## 💡 Beginner's Code Tour

If you are new to Java and Spring Boot:

- **[`Expense.java`](file:///src/main/java/com/example/expensetracker/model/Expense.java)**: The entity model. We use `BigDecimal` instead of `double` or `float` because financial calculations require exact decimal precision without binary rounding artifacts.
- **[`ExpenseRequest.java`](file:///src/main/java/com/example/expensetracker/dto/ExpenseRequest.java)**: The DTO (Data Transfer Object). Notice the annotations like `@Positive` and `@NotBlank`. Spring automatically validates the request before your code runs.
- **[`InMemoryExpenseRepository.java`](file:///src/main/java/com/example/expensetracker/repository/InMemoryExpenseRepository.java)**: Uses `ConcurrentHashMap` and `AtomicLong` for thread-safe access. This simulates a real database in memory.
- **[`ExpenseServiceImpl.java`](file:///src/main/java/com/example/expensetracker/service/ExpenseServiceImpl.java)**: Encapsulates all calculation logic, such as summing today's vs. this month's spending and calculating percentages.
- **[`ExpenseController.java`](file:///src/main/java/com/example/expensetracker/controller/ExpenseController.java)**: Handles HTTP requests, paths, and status codes.
- **[`GlobalExceptionHandler.java`](file:///src/main/java/com/example/expensetracker/exception/GlobalExceptionHandler.java)**: Catches validation and not-found errors and formats them into clean JSON error responses.
- **[`index.html`](file:///src/main/resources/static/index.html)** & **[`script.js`](file:///src/main/resources/static/js/script.js)**: Placed inside `src/main/resources/static/`. Spring Boot serves static files from this folder at the root URL `/` automatically!
