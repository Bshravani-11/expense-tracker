/**
 * ============================================================================
 * Expense Tracker — Static Frontend JavaScript (localStorage version)
 * ============================================================================
 * This version runs entirely in the browser — no Spring Boot backend required.
 * All data is stored in the browser's localStorage so it persists across
 * page refreshes and browser sessions on the same device.
 *
 * localStorage keys used:
 *   'expenses'       -> JSON array of expense objects
 *   'nextId'         -> auto-incrementing numeric ID counter
 *   'monthlySalary'  -> the user's monthly salary (number)
 * ============================================================================
 */

// Category color mappings and icons for badges
const CATEGORY_CONFIG = {
    'Food & Dining':    { color: 'badge-food',          hex: '#f97316', icon: '🍔' },
    'Transportation':   { color: 'badge-transport',     hex: '#0284c7', icon: '🚗' },
    'Shopping':         { color: 'badge-shopping',      hex: '#8b5cf6', icon: '🛍️' },
    'Entertainment':    { color: 'badge-entertainment', hex: '#ec4899', icon: '🎬' },
    'Bills & Utilities':{ color: 'badge-bills',         hex: '#eab308', icon: '💡' },
    'Healthcare':       { color: 'badge-health',        hex: '#059669', icon: '💊' },
    'Education':        { color: 'badge-education',     hex: '#2563eb', icon: '📚' },
    'Other':            { color: 'badge-other',         hex: '#64748b', icon: '🏷️' }
};

// Global state
let currentExpenses = [];   // currently displayed expenses (may be filtered)
let pendingDeleteId = null; // ID of the expense pending confirmation to delete
let currentMonthlySalary = 50000; // default salary

// ============================================================================
// localStorage Helpers
// ============================================================================

/**
 * Returns all expenses from localStorage as an array.
 */
function getAllExpenses() {
    try {
        return JSON.parse(localStorage.getItem('expenses') || '[]');
    } catch {
        return [];
    }
}

/**
 * Saves the given expenses array to localStorage.
 */
function saveAllExpenses(expenses) {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

/**
 * Generates and returns the next auto-increment ID.
 * Mimics the AtomicLong counter from the Java backend.
 */
function nextId() {
    const id = parseInt(localStorage.getItem('nextId') || '1', 10);
    localStorage.setItem('nextId', id + 1);
    return id;
}

/**
 * Returns the saved monthly salary from localStorage.
 * Defaults to 50000 if not set.
 */
function getMonthlySalary() {
    return parseFloat(localStorage.getItem('monthlySalary') || '50000');
}

/**
 * Saves the monthly salary to localStorage.
 */
function saveMonthlySalary(val) {
    localStorage.setItem('monthlySalary', String(val));
}

/**
 * Seeds 4 sample expenses on first load (when localStorage is empty).
 * Mirrors the @PostConstruct seed data in InMemoryExpenseRepository.java.
 */
function initSampleDataIfNeeded() {
    const existing = getAllExpenses();
    if (existing.length > 0) return; // already has data, skip seeding

    const today = getTodayDateString();
    // Compute dates relative to today
    const daysAgo = (n) => {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const samples = [
        { description: 'Weekly Grocery Shopping',   amount: 1450.00, category: 'Food & Dining',     date: today },
        { description: 'Metro Smart Card Recharge',  amount: 500.00,  category: 'Transportation',    date: daysAgo(1) },
        { description: 'Broadband Internet Bill',    amount: 999.00,  category: 'Bills & Utilities', date: daysAgo(4) },
        { description: 'New Wireless Headphones',    amount: 2299.00, category: 'Shopping',          date: daysAgo(6) }
    ];

    const seeded = samples.map(s => ({ id: nextId(), ...s }));
    saveAllExpenses(seeded);
}

// ============================================================================
// Data Operations (replaces REST API calls)
// ============================================================================

/**
 * Loads and returns expenses from localStorage, optionally filtered by category.
 * Mirrors: GET /api/expenses?category=...
 */
function loadExpenses(category = 'All') {
    let expenses = getAllExpenses();

    // Sort by date descending (newest first), then by id descending
    expenses.sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.id - a.id;
    });

    if (category && category !== 'All') {
        expenses = expenses.filter(e => e.category === category);
    }

    currentExpenses = expenses;
    renderExpensesTable(expenses, category);
}

/**
 * Computes summary metrics from localStorage data and renders them.
 * Mirrors: GET /api/expenses/summary
 */
function loadSummary() {
    const all = getAllExpenses();
    const todayStr = getTodayDateString();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed

    let totalExpenses = 0;
    let todayExpenses = 0;
    let thisMonthExpenses = 0;
    const categoryBreakdown = {};

    all.forEach(e => {
        const amt = Number(e.amount) || 0;
        totalExpenses += amt;

        if (e.date === todayStr) {
            todayExpenses += amt;
        }

        // Check if the expense is in the current month/year
        if (e.date) {
            const parts = e.date.split('-');
            if (parts.length === 3) {
                const yr = parseInt(parts[0], 10);
                const mo = parseInt(parts[1], 10);
                if (yr === currentYear && mo === currentMonth) {
                    thisMonthExpenses += amt;
                }
            }
        }

        // Build category breakdown
        if (e.category) {
            categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + amt;
        }
    });

    // Compute percentage of each category relative to total
    const categoryPercentages = {};
    if (totalExpenses > 0) {
        for (const [cat, amt] of Object.entries(categoryBreakdown)) {
            categoryPercentages[cat] = Math.round((amt / totalExpenses) * 100);
        }
    }

    const salary = getMonthlySalary();
    const remaining = salary - thisMonthExpenses;
    const salarySpentPercentage = salary > 0 ? (thisMonthExpenses / salary) * 100 : 0;

    const summary = {
        totalExpenses,
        totalTransactions: all.length,
        todayExpenses,
        thisMonthExpenses,
        categoryBreakdown,
        categoryPercentages,
        monthlySalary: salary,
        remainingSalary: remaining,
        salarySpentPercentage
    };

    renderSummaryMetrics(summary);
    renderCategoryBreakdown(summary);
}

/**
 * Creates a new expense in localStorage.
 * Mirrors: POST /api/expenses
 * Returns the created expense object, or throws an Error on validation failure.
 */
function createExpense(description, amount, category, date) {
    // Validate
    if (!description || description.trim().length < 2) {
        throw new Error('Description must be at least 2 characters');
    }
    if (isNaN(amount) || amount <= 0) {
        throw new Error('Amount must be a positive number greater than 0');
    }
    if (!category) {
        throw new Error('Please select an expense category');
    }
    if (!date) {
        throw new Error('Please select a valid date');
    }

    const expense = {
        id: nextId(),
        description: description.trim(),
        amount: parseFloat(amount.toFixed(2)),
        category,
        date
    };

    const all = getAllExpenses();
    all.push(expense);
    saveAllExpenses(all);

    return expense;
}

/**
 * Deletes an expense by ID from localStorage.
 * Mirrors: DELETE /api/expenses/{id}
 */
function deleteExpenseById(id) {
    const all = getAllExpenses();
    const filtered = all.filter(e => e.id !== id);
    if (filtered.length === all.length) {
        throw new Error(`Expense with ID ${id} not found`);
    }
    saveAllExpenses(filtered);
}

// ============================================================================
// DOM Elements
// ============================================================================

const totalExpensesEl        = document.getElementById('totalExpenses');
const totalCountBadgeEl      = document.getElementById('totalCountBadge');
const todayExpensesEl        = document.getElementById('todayExpenses');
const todayDateLabelEl       = document.getElementById('todayDateLabel');
const monthExpensesEl        = document.getElementById('monthExpenses');
const currentMonthLabelEl    = document.getElementById('currentMonthLabel');
const topCategoryNameEl      = document.getElementById('topCategoryName');
const topCategoryAmountEl    = document.getElementById('topCategoryAmount');

const categoryFilterEl       = document.getElementById('categoryFilter');
const refreshBtnEl           = document.getElementById('refreshBtn');
const expensesTableBodyEl    = document.getElementById('expensesTableBody');
const transactionTableEl     = document.getElementById('transactionTable');
const emptyStateEl           = document.getElementById('emptyState');
const emptyStateTitleEl      = document.getElementById('emptyStateTitle');
const emptyStateMessageEl    = document.getElementById('emptyStateMessage');
const emptyAddBtnEl          = document.getElementById('emptyAddBtn');

const distributionMeterEl    = document.getElementById('distributionMeter');
const categoryBreakdownListEl= document.getElementById('categoryBreakdownList');
const emptyCategoryHintEl    = document.getElementById('emptyCategoryHint');

// Modals
const openAddModalBtnEl      = document.getElementById('openAddModalBtn');
const addExpenseModalEl      = document.getElementById('addExpenseModal');
const closeModalBtnEl        = document.getElementById('closeModalBtn');
const cancelModalBtnEl       = document.getElementById('cancelModalBtn');
const modalAddFormEl         = document.getElementById('modalAddForm');
const modalFormAlertEl       = document.getElementById('modalFormAlert');

const deleteConfirmModalEl   = document.getElementById('deleteConfirmModal');
const closeDeleteModalBtnEl  = document.getElementById('closeDeleteModalBtn');
const cancelDeleteBtnEl      = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtnEl     = document.getElementById('confirmDeleteBtn');
const deleteExpenseDescEl    = document.getElementById('deleteExpenseDesc');
const deleteExpenseAmtEl     = document.getElementById('deleteExpenseAmt');

const quickAddFormEl         = document.getElementById('quickAddForm');

// Salary elements
const displayMonthlySalaryEl    = document.getElementById('displayMonthlySalary');
const displaySalarySpentEl      = document.getElementById('displaySalarySpent');
const displaySpentPctLabelEl    = document.getElementById('displaySpentPctLabel');
const displayRemainingSalaryEl  = document.getElementById('displayRemainingSalary');
const salaryStatusBadgeEl       = document.getElementById('salaryStatusBadge');
const salaryProgressFillEl      = document.getElementById('salaryProgressFill');
const salaryProgressTextEl      = document.getElementById('salaryProgressText');
const salaryRemainingPctTextEl  = document.getElementById('salaryRemainingPctText');

const openSalaryModalBtnEl   = document.getElementById('openSalaryModalBtn');
const updateSalaryModalEl    = document.getElementById('updateSalaryModal');
const closeSalaryModalBtnEl  = document.getElementById('closeSalaryModalBtn');
const cancelSalaryBtnEl      = document.getElementById('cancelSalaryBtn');
const salaryUpdateFormEl     = document.getElementById('salaryUpdateForm');
const inputMonthlySalaryEl   = document.getElementById('inputMonthlySalary');
const salaryInputErrorEl     = document.getElementById('salaryInputError');
const saveSalaryBtnEl        = document.getElementById('saveSalaryBtn');

const toastContainerEl       = document.getElementById('toastContainer');

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Seed sample data if localStorage is empty
    initSampleDataIfNeeded();

    // Read salary from localStorage
    currentMonthlySalary = getMonthlySalary();

    // Set default dates to today (YYYY-MM-DD)
    const todayStr = getTodayDateString();
    document.getElementById('quickDate').value = todayStr;
    document.getElementById('modalDate').value = todayStr;

    // Display current month and today's date in metric card labels
    const now = new Date();
    currentMonthLabelEl.textContent = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    todayDateLabelEl.textContent    = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    // Attach all event listeners
    setupEventListeners();

    // Initial render
    loadDashboardData();
});

/**
 * Loads both summary metrics and the expenses table.
 */
function loadDashboardData() {
    loadExpenses(categoryFilterEl.value);
    loadSummary();
}

// ============================================================================
// Event Listeners
// ============================================================================

function setupEventListeners() {
    // Category filter dropdown
    categoryFilterEl.addEventListener('change', () => {
        loadExpenses(categoryFilterEl.value);
    });

    // Refresh button
    refreshBtnEl.addEventListener('click', () => {
        loadDashboardData();
        showToast('Dashboard refreshed', 'info');
    });

    // Quick Add Form submit
    quickAddFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmit('quick');
    });

    // Modal Add Form submit
    modalAddFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmit('modal');
    });

    // Open Add Modal
    openAddModalBtnEl.addEventListener('click', () => openModal(addExpenseModalEl));
    emptyAddBtnEl.addEventListener('click', () => openModal(addExpenseModalEl));

    // Close Add Modal
    closeModalBtnEl.addEventListener('click', () => closeModal(addExpenseModalEl));
    cancelModalBtnEl.addEventListener('click', () => closeModal(addExpenseModalEl));

    // Close Delete Modal
    closeDeleteModalBtnEl.addEventListener('click', () => closeModal(deleteConfirmModalEl));
    cancelDeleteBtnEl.addEventListener('click', () => closeModal(deleteConfirmModalEl));

    // Confirm Delete button
    confirmDeleteBtnEl.addEventListener('click', executeDelete);

    // Salary Modal — open, pre-fill current value
    openSalaryModalBtnEl.addEventListener('click', () => {
        inputMonthlySalaryEl.value = currentMonthlySalary;
        salaryInputErrorEl.textContent = '';
        inputMonthlySalaryEl.classList.remove('is-invalid');
        openModal(updateSalaryModalEl);
    });
    closeSalaryModalBtnEl.addEventListener('click', () => closeModal(updateSalaryModalEl));
    cancelSalaryBtnEl.addEventListener('click', () => closeModal(updateSalaryModalEl));

    // Salary Form submit — saves to localStorage (no API call needed)
    salaryUpdateFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = parseFloat(inputMonthlySalaryEl.value);

        if (isNaN(val) || val <= 0) {
            salaryInputErrorEl.textContent = 'Please enter a valid salary greater than 0';
            inputMonthlySalaryEl.classList.add('is-invalid');
            return;
        }

        salaryInputErrorEl.textContent = '';
        inputMonthlySalaryEl.classList.remove('is-invalid');
        saveSalaryBtnEl.disabled = true;
        saveSalaryBtnEl.innerHTML = 'Saving...';

        // Save to localStorage
        saveMonthlySalary(val);
        currentMonthlySalary = val;

        showToast(`Monthly salary updated to ${formatINR(val)}`, 'success');
        closeModal(updateSalaryModalEl);
        loadDashboardData();

        saveSalaryBtnEl.disabled = false;
        saveSalaryBtnEl.innerHTML = '<span class="btn-text">Save Salary</span>';
    });

    // Close modals when clicking the dark backdrop outside the modal card
    window.addEventListener('click', (e) => {
        if (e.target === addExpenseModalEl)    closeModal(addExpenseModalEl);
        if (e.target === deleteConfirmModalEl) closeModal(deleteConfirmModalEl);
        if (e.target === updateSalaryModalEl)  closeModal(updateSalaryModalEl);
    });

    // Close modals on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal(addExpenseModalEl);
            closeModal(deleteConfirmModalEl);
            closeModal(updateSalaryModalEl);
        }
    });
}

// ============================================================================
// Form Submission Handler
// ============================================================================

/**
 * Handles submit for both Quick Add and Modal Add forms.
 * prefix is either 'quick' or 'modal'.
 */
function handleFormSubmit(prefix) {
    const descInput      = document.getElementById(`${prefix}Description`);
    const amountInput    = document.getElementById(`${prefix}Amount`);
    const categorySelect = document.getElementById(`${prefix}Category`);
    const dateInput      = document.getElementById(`${prefix}Date`);

    // Reset previous inline error messages
    clearErrors(prefix);

    const description = descInput.value.trim();
    const amountVal   = parseFloat(amountInput.value);
    const category    = categorySelect.value;
    const date        = dateInput.value;

    // Client-side validation
    let hasError = false;

    if (!description || description.length < 2) {
        showFieldError(`${prefix}DescError`, 'Description must be at least 2 characters');
        descInput.classList.add('is-invalid');
        hasError = true;
    }

    if (isNaN(amountVal) || amountVal <= 0) {
        showFieldError(`${prefix}AmountError`, 'Amount must be a positive number greater than 0');
        amountInput.classList.add('is-invalid');
        hasError = true;
    }

    if (!category) {
        showFieldError(`${prefix}CategoryError`, 'Please select an expense category');
        categorySelect.classList.add('is-invalid');
        hasError = true;
    }

    if (!date) {
        showFieldError(`${prefix}DateError`, 'Please select a valid date');
        dateInput.classList.add('is-invalid');
        hasError = true;
    }

    if (hasError) return;

    // Disable submit button while "saving"
    const submitBtn = prefix === 'quick'
        ? document.getElementById('quickSubmitBtn')
        : document.getElementById('saveExpenseBtn');

    const originalBtnHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Saving...';

    try {
        // Save to localStorage (synchronous, unlike fetch)
        const created = createExpense(description, amountVal, category, date);

        showToast(`Added: ${created.description} (${formatINR(created.amount)})`, 'success');

        // Reset the form
        if (prefix === 'modal') {
            modalAddFormEl.reset();
            document.getElementById('modalDate').value = getTodayDateString();
            closeModal(addExpenseModalEl);
        } else {
            quickAddFormEl.reset();
            document.getElementById('quickDate').value = getTodayDateString();
        }

        // Refresh dashboard
        loadDashboardData();

    } catch (err) {
        // Show validation error
        if (prefix === 'modal') {
            modalFormAlertEl.textContent = err.message;
            modalFormAlertEl.style.display = 'block';
        } else {
            showToast(err.message, 'error');
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
    }
}

/**
 * Opens the delete confirmation dialog for the expense with the given ID.
 */
function promptDeleteExpense(id) {
    const expense = currentExpenses.find(e => e.id === id);
    if (!expense) return;

    pendingDeleteId = id;
    deleteExpenseDescEl.textContent = expense.description;
    deleteExpenseAmtEl.textContent  = formatINR(expense.amount);

    openModal(deleteConfirmModalEl);
}

/**
 * Executes the deletion after the user confirms.
 */
function executeDelete() {
    if (!pendingDeleteId) return;

    confirmDeleteBtnEl.disabled = true;
    confirmDeleteBtnEl.textContent = 'Deleting...';

    try {
        deleteExpenseById(pendingDeleteId);
        showToast('Expense removed successfully', 'info');
        closeModal(deleteConfirmModalEl);
        pendingDeleteId = null;
        loadDashboardData();
    } catch (err) {
        showToast('Failed to delete expense: ' + err.message, 'error');
    } finally {
        confirmDeleteBtnEl.disabled = false;
        confirmDeleteBtnEl.textContent = 'Delete';
    }
}

// ============================================================================
// UI Rendering Functions
// ============================================================================

/**
 * Populates the top four summary metric cards and salary tracker section.
 */
function renderSummaryMetrics(summary) {
    totalExpensesEl.textContent    = formatINR(summary.totalExpenses || 0);
    totalCountBadgeEl.textContent  = `${summary.totalTransactions || 0} transaction${summary.totalTransactions === 1 ? '' : 's'}`;

    todayExpensesEl.textContent    = formatINR(summary.todayExpenses || 0);
    monthExpensesEl.textContent    = formatINR(summary.thisMonthExpenses || 0);

    // Monthly Salary & Savings Tracker
    const salary         = summary.monthlySalary || currentMonthlySalary;
    const spentThisMonth = summary.thisMonthExpenses || 0;
    const remaining      = summary.remainingSalary !== undefined ? summary.remainingSalary : (salary - spentThisMonth);
    const spentPct       = summary.salarySpentPercentage !== undefined ? summary.salarySpentPercentage : (salary > 0 ? (spentThisMonth / salary) * 100 : 0);

    displayMonthlySalaryEl.textContent   = formatINR(salary);
    displaySalarySpentEl.textContent     = formatINR(spentThisMonth);
    displaySpentPctLabelEl.textContent   = `${spentPct.toFixed(1)}% of salary spent`;
    displayRemainingSalaryEl.textContent = formatINR(remaining);

    // Progress bar fill — clamped between 0 and 100%
    const progressFillWidth = Math.min(Math.max(spentPct, 0), 100);
    salaryProgressFillEl.style.width   = `${progressFillWidth}%`;
    salaryProgressTextEl.textContent   = `${formatINR(spentThisMonth)} spent of ${formatINR(salary)}`;

    const remainingPct = Math.max(100 - spentPct, 0);
    salaryRemainingPctTextEl.textContent = `${remainingPct.toFixed(1)}% savings remaining`;

    // Dynamic color coding based on budget utilization
    if (spentPct > 100) {
        salaryStatusBadgeEl.className            = 'salary-status-badge badge-danger';
        salaryStatusBadgeEl.textContent          = 'Over Budget';
        displayRemainingSalaryEl.className       = 'salary-metric-value text-overbudget';
        salaryProgressFillEl.style.background    = '#ef4444';
    } else if (spentPct > 75) {
        salaryStatusBadgeEl.className            = 'salary-status-badge badge-warning';
        salaryStatusBadgeEl.textContent          = 'Caution (>75%)';
        displayRemainingSalaryEl.className       = 'salary-metric-value';
        salaryProgressFillEl.style.background    = '#f59e0b';
    } else {
        salaryStatusBadgeEl.className            = 'salary-status-badge badge-safe';
        salaryStatusBadgeEl.textContent          = 'On Track';
        displayRemainingSalaryEl.className       = 'salary-metric-value text-remaining';
        salaryProgressFillEl.style.background    = 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)';
    }

    // Determine top spending category
    const breakdown = summary.categoryBreakdown || {};
    let topCat = null;
    let maxVal = -1;

    for (const [cat, amt] of Object.entries(breakdown)) {
        if (amt > maxVal) {
            maxVal = amt;
            topCat = cat;
        }
    }

    if (topCat && maxVal > 0) {
        const icon = CATEGORY_CONFIG[topCat]?.icon || '🏷️';
        topCategoryNameEl.textContent   = `${icon} ${topCat}`;
        topCategoryAmountEl.textContent = formatINR(maxVal);
    } else {
        topCategoryNameEl.textContent   = '—';
        topCategoryAmountEl.textContent = '₹0.00';
    }
}

/**
 * Renders the transactions table rows, or shows the empty state if there are none.
 */
function renderExpensesTable(expenses, selectedCategory) {
    expensesTableBodyEl.innerHTML = '';

    if (!expenses || expenses.length === 0) {
        // Show empty state message
        transactionTableEl.style.display = 'none';
        emptyStateEl.style.display       = 'flex';

        if (selectedCategory && selectedCategory !== 'All') {
            emptyStateTitleEl.textContent   = `No Expenses in "${selectedCategory}"`;
            emptyStateMessageEl.textContent = `There are no recorded expenses under "${selectedCategory}". Try selecting another category or add a new expense!`;
        } else {
            emptyStateTitleEl.textContent   = 'No Expenses Recorded Yet';
            emptyStateMessageEl.textContent = 'Your expense list is currently empty. Record your first transaction to start tracking your budget!';
        }
        return;
    }

    // Show table, hide empty state
    transactionTableEl.style.display = 'table';
    emptyStateEl.style.display       = 'none';

    expenses.forEach(item => {
        const tr = document.createElement('tr');

        // Formatted Date cell
        const dateCell = document.createElement('td');
        dateCell.className   = 'date-cell';
        dateCell.textContent = formatDate(item.date);
        tr.appendChild(dateCell);

        // Description cell
        const descCell = document.createElement('td');
        descCell.className   = 'desc-cell';
        descCell.textContent = item.description;
        tr.appendChild(descCell);

        // Category badge cell
        const catCell  = document.createElement('td');
        const catConfig = CATEGORY_CONFIG[item.category] || { color: 'badge-other', icon: '🏷️' };
        catCell.innerHTML = `<span class="badge ${catConfig.color}">${catConfig.icon} ${escapeHtml(item.category)}</span>`;
        tr.appendChild(catCell);

        // Amount (INR ₹) cell
        const amtCell = document.createElement('td');
        amtCell.className   = 'amount-cell text-right';
        amtCell.textContent = formatINR(item.amount);
        tr.appendChild(amtCell);

        // Delete action cell
        const actionCell = document.createElement('td');
        actionCell.className = 'text-center';
        actionCell.innerHTML = `
            <button class="btn-icon-danger" onclick="promptDeleteExpense(${item.id})" title="Delete expense" aria-label="Delete ${escapeHtml(item.description)}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
            </button>
        `;
        tr.appendChild(actionCell);

        expensesTableBodyEl.appendChild(tr);
    });
}

/**
 * Renders the category breakdown sidebar list and visual distribution meter.
 */
function renderCategoryBreakdown(summary) {
    categoryBreakdownListEl.innerHTML = '';
    distributionMeterEl.innerHTML     = '';

    const breakdown   = summary.categoryBreakdown   || {};
    const percentages = summary.categoryPercentages || {};
    const categories  = Object.keys(breakdown);

    if (categories.length === 0 || (summary.totalExpenses && summary.totalExpenses <= 0)) {
        emptyCategoryHintEl.style.display  = 'block';
        distributionMeterEl.style.display  = 'none';
        return;
    }

    emptyCategoryHintEl.style.display  = 'none';
    distributionMeterEl.style.display  = 'flex';

    // Sort categories descending by amount spent
    categories.sort((a, b) => breakdown[b] - breakdown[a]);

    categories.forEach(cat => {
        const amt    = breakdown[cat];
        const pct    = percentages[cat] || 0;
        const config = CATEGORY_CONFIG[cat] || { hex: '#64748b', icon: '🏷️' };

        // Add a colored segment to the visual distribution meter bar
        const meterSegment = document.createElement('div');
        meterSegment.className            = 'meter-segment';
        meterSegment.style.width          = `${pct}%`;
        meterSegment.style.backgroundColor= config.hex;
        meterSegment.title                = `${cat}: ${formatINR(amt)} (${pct}%)`;
        distributionMeterEl.appendChild(meterSegment);

        // Add detailed row in the category breakdown list
        const itemEl = document.createElement('div');
        itemEl.className = 'category-item';
        itemEl.innerHTML = `
            <div class="category-item-top">
                <span class="category-item-name">
                    <span class="category-dot" style="background-color: ${config.hex};"></span>
                    <span>${config.icon} ${escapeHtml(cat)}</span>
                </span>
                <div>
                    <span class="category-item-val">${formatINR(amt)}</span>
                    <span class="category-item-pct">(${pct}%)</span>
                </div>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width: ${pct}%; background-color: ${config.hex};"></div>
            </div>
        `;
        categoryBreakdownListEl.appendChild(itemEl);
    });
}

// ============================================================================
// Modal & Toast Helpers
// ============================================================================

function openModal(modalEl) {
    modalEl.classList.add('show');
    modalEl.setAttribute('aria-hidden', 'false');
    // Clear any previous error styling when opening the add modal
    if (modalEl === addExpenseModalEl) {
        modalFormAlertEl.style.display = 'none';
        clearErrors('modal');
    }
}

function closeModal(modalEl) {
    modalEl.classList.remove('show');
    modalEl.setAttribute('aria-hidden', 'true');
}

/**
 * Displays a floating toast notification.
 * @param {string} message - Message to display
 * @param {'success'|'error'|'info'} type - Toast type
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
        <span class="toast-icon">${iconSvg}</span>
        <span>${escapeHtml(message)}</span>
    `;

    toastContainerEl.appendChild(toast);

    // Auto-remove toast after 3.5 seconds with fade-out animation
    setTimeout(() => {
        toast.style.opacity   = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition= 'opacity 0.25s ease, transform 0.25s ease';
        setTimeout(() => toast.remove(), 250);
    }, 3500);
}

function showFieldError(errorElId, message) {
    const el = document.getElementById(errorElId);
    if (el) el.textContent = message;
}

function clearErrors(prefix) {
    ['Desc', 'Amount', 'Category', 'Date'].forEach(field => {
        const errorEl = document.getElementById(`${prefix}${field}Error`);
        if (errorEl) errorEl.textContent = '';
        const inputEl = document.getElementById(`${prefix}${field === 'Desc' ? 'Description' : field}`);
        if (inputEl) inputEl.classList.remove('is-invalid');
    });
}

// ============================================================================
// Formatting Utilities
// ============================================================================

/**
 * Formats a number as Indian Rupees (INR) with the ₹ symbol.
 * Uses Indian number grouping: ₹1,25,000.00
 */
function formatINR(val) {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num);
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into readable Indian date format.
 * Example: "2026-10-19" -> "19 Oct 2026"
 */
function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const year  = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // 0-indexed for Date
            const day   = parseInt(parts[2], 10);
            const date  = new Date(year, month, day);
            return date.toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
        }
        return dateStr;
    } catch {
        return dateStr;
    }
}

/**
 * Returns today's date as a YYYY-MM-DD string (suitable for <input type="date">).
 */
function getTodayDateString() {
    const today = new Date();
    const yyyy  = today.getFullYear();
    const mm    = String(today.getMonth() + 1).padStart(2, '0');
    const dd    = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Escapes HTML special characters to prevent XSS when setting innerHTML.
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;');
}
