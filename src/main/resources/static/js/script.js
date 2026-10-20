/**
 * ============================================================================
 * Expense Tracker — Frontend JavaScript
 * ============================================================================
 * This script communicates with the Spring Boot REST API using fetch().
 * 
 * Endpoints consumed:
 * - GET    /api/expenses          -> Fetch all or filtered expenses
 * - GET    /api/expenses/summary  -> Fetch computed summary metrics
 * - POST   /api/expenses          -> Add a new expense
 * - DELETE /api/expenses/{id}     -> Delete an expense
 */

// Base URL for the Spring Boot REST API
const API_BASE_URL = '/api/expenses';

// Category color mappings and icons for badges
const CATEGORY_CONFIG = {
    'Food & Dining': { color: 'badge-food', hex: '#f97316', icon: '🍔' },
    'Transportation': { color: 'badge-transport', hex: '#0284c7', icon: '🚗' },
    'Shopping': { color: 'badge-shopping', hex: '#8b5cf6', icon: '🛍️' },
    'Entertainment': { color: 'badge-entertainment', hex: '#ec4899', icon: '🎬' },
    'Bills & Utilities': { color: 'badge-bills', hex: '#eab308', icon: '💡' },
    'Healthcare': { color: 'badge-health', hex: '#059669', icon: '💊' },
    'Education': { color: 'badge-education', hex: '#2563eb', icon: '📚' },
    'Other': { color: 'badge-other', hex: '#64748b', icon: '🏷️' }
};

// Global state tracking
let currentExpenses = [];
let pendingDeleteId = null;

// DOM Elements
const totalExpensesEl = document.getElementById('totalExpenses');
const totalCountBadgeEl = document.getElementById('totalCountBadge');
const todayExpensesEl = document.getElementById('todayExpenses');
const todayDateLabelEl = document.getElementById('todayDateLabel');
const monthExpensesEl = document.getElementById('monthExpenses');
const currentMonthLabelEl = document.getElementById('currentMonthLabel');
const topCategoryNameEl = document.getElementById('topCategoryName');
const topCategoryAmountEl = document.getElementById('topCategoryAmount');

const categoryFilterEl = document.getElementById('categoryFilter');
const refreshBtnEl = document.getElementById('refreshBtn');
const expensesTableBodyEl = document.getElementById('expensesTableBody');
const transactionTableEl = document.getElementById('transactionTable');
const emptyStateEl = document.getElementById('emptyState');
const emptyStateTitleEl = document.getElementById('emptyStateTitle');
const emptyStateMessageEl = document.getElementById('emptyStateMessage');
const emptyAddBtnEl = document.getElementById('emptyAddBtn');

const distributionMeterEl = document.getElementById('distributionMeter');
const categoryBreakdownListEl = document.getElementById('categoryBreakdownList');
const emptyCategoryHintEl = document.getElementById('emptyCategoryHint');

// Modals
const openAddModalBtnEl = document.getElementById('openAddModalBtn');
const addExpenseModalEl = document.getElementById('addExpenseModal');
const closeModalBtnEl = document.getElementById('closeModalBtn');
const cancelModalBtnEl = document.getElementById('cancelModalBtn');
const modalAddFormEl = document.getElementById('modalAddForm');
const modalFormAlertEl = document.getElementById('modalFormAlert');

const deleteConfirmModalEl = document.getElementById('deleteConfirmModal');
const closeDeleteModalBtnEl = document.getElementById('closeDeleteModalBtn');
const cancelDeleteBtnEl = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtnEl = document.getElementById('confirmDeleteBtn');
const deleteExpenseDescEl = document.getElementById('deleteExpenseDesc');
const deleteExpenseAmtEl = document.getElementById('deleteExpenseAmt');

// Quick Add Form
const quickAddFormEl = document.getElementById('quickAddForm');

// Salary & Savings Tracker Elements
let currentMonthlySalary = 50000;
const displayMonthlySalaryEl = document.getElementById('displayMonthlySalary');
const displaySalarySpentEl = document.getElementById('displaySalarySpent');
const displaySpentPctLabelEl = document.getElementById('displaySpentPctLabel');
const displayRemainingSalaryEl = document.getElementById('displayRemainingSalary');
const salaryStatusBadgeEl = document.getElementById('salaryStatusBadge');
const salaryProgressFillEl = document.getElementById('salaryProgressFill');
const salaryProgressTextEl = document.getElementById('salaryProgressText');
const salaryRemainingPctTextEl = document.getElementById('salaryRemainingPctText');

// Salary Modal Elements
const openSalaryModalBtnEl = document.getElementById('openSalaryModalBtn');
const updateSalaryModalEl = document.getElementById('updateSalaryModal');
const closeSalaryModalBtnEl = document.getElementById('closeSalaryModalBtn');
const cancelSalaryBtnEl = document.getElementById('cancelSalaryBtn');
const salaryUpdateFormEl = document.getElementById('salaryUpdateForm');
const inputMonthlySalaryEl = document.getElementById('inputMonthlySalary');
const salaryInputErrorEl = document.getElementById('salaryInputError');
const saveSalaryBtnEl = document.getElementById('saveSalaryBtn');

// Toast Container
const toastContainerEl = document.getElementById('toastContainer');

// ============================================================================
// Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Set default dates to today (YYYY-MM-DD)
    const todayStr = getTodayDateString();
    document.getElementById('quickDate').value = todayStr;
    document.getElementById('modalDate').value = todayStr;

    // Display current month in metric card label
    const now = new Date();
    currentMonthLabelEl.textContent = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    todayDateLabelEl.textContent = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

    // Attach event listeners
    setupEventListeners();

    // Initial load from backend API
    loadDashboardData();
});

/**
 * Attaches event listeners to buttons, forms, and filter dropdowns.
 */
function setupEventListeners() {
    // Category filter dropdown change
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

    // Confirm Delete action
    confirmDeleteBtnEl.addEventListener('click', executeDelete);

    // Salary Modal
    openSalaryModalBtnEl.addEventListener('click', () => {
        inputMonthlySalaryEl.value = currentMonthlySalary;
        salaryInputErrorEl.textContent = '';
        inputMonthlySalaryEl.classList.remove('is-invalid');
        openModal(updateSalaryModalEl);
    });
    closeSalaryModalBtnEl.addEventListener('click', () => closeModal(updateSalaryModalEl));
    cancelSalaryBtnEl.addEventListener('click', () => closeModal(updateSalaryModalEl));

    // Salary Form submit
    salaryUpdateFormEl.addEventListener('submit', async (e) => {
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

        try {
            const response = await fetch(`${API_BASE_URL}/salary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ salary: val })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to update salary');
            }

            currentMonthlySalary = val;
            showToast(`Monthly salary updated to ${formatINR(val)}`, 'success');
            closeModal(updateSalaryModalEl);
            await loadDashboardData();
        } catch (err) {
            console.error('Error updating salary:', err);
            salaryInputErrorEl.textContent = err.message;
            inputMonthlySalaryEl.classList.add('is-invalid');
        } finally {
            saveSalaryBtnEl.disabled = false;
            saveSalaryBtnEl.innerHTML = '<span class="btn-text">Save Salary</span>';
        }
    });

    // Close modals on clicking outside the card
    window.addEventListener('click', (e) => {
        if (e.target === addExpenseModalEl) closeModal(addExpenseModalEl);
        if (e.target === deleteConfirmModalEl) closeModal(deleteConfirmModalEl);
        if (e.target === updateSalaryModalEl) closeModal(updateSalaryModalEl);
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
// Data Loading & API Calls
// ============================================================================

/**
 * Loads both summary statistics and expense list from backend REST API.
 */
async function loadDashboardData() {
    await Promise.all([
        loadExpenses(categoryFilterEl.value),
        loadSummary()
    ]);
}

/**
 * Calls GET /api/expenses (with optional ?category=...)
 * and renders rows in the table.
 */
async function loadExpenses(category = 'All') {
    try {
        let url = API_BASE_URL;
        if (category && category !== 'All') {
            url += `?category=${encodeURIComponent(category)}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch expenses (HTTP ${response.status})`);
        }

        const expenses = await response.json();
        currentExpenses = expenses;
        renderExpensesTable(expenses, category);
    } catch (error) {
        console.error('Error fetching expenses:', error);
        showToast('Unable to connect to backend server. Make sure Spring Boot is running.', 'error');
    }
}

/**
 * Calls GET /api/expenses/summary to fetch aggregated metrics
 * (total, today, this month, category breakdown).
 */
async function loadSummary() {
    try {
        const response = await fetch(`${API_BASE_URL}/summary`);
        if (!response.ok) {
            throw new Error(`Failed to fetch summary (HTTP ${response.status})`);
        }

        const summary = await response.json();
        renderSummaryMetrics(summary);
        renderCategoryBreakdown(summary);
    } catch (error) {
        console.error('Error fetching summary:', error);
    }
}

/**
 * Handles submission of both Quick Add and Modal Add forms.
 */
async function handleFormSubmit(prefix) {
    const descInput = document.getElementById(`${prefix}Description`);
    const amountInput = document.getElementById(`${prefix}Amount`);
    const categorySelect = document.getElementById(`${prefix}Category`);
    const dateInput = document.getElementById(`${prefix}Date`);

    // Reset inline error messages
    clearErrors(prefix);

    const description = descInput.value.trim();
    const amountVal = parseFloat(amountInput.value);
    const category = categorySelect.value;
    const date = dateInput.value;

    // Validate fields on the client side
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

    // Prepare JSON payload for POST /api/expenses
    const payload = {
        description: description,
        amount: amountVal,
        category: category,
        date: date
    };

    const submitBtn = prefix === 'quick'
        ? document.getElementById('quickSubmitBtn')
        : document.getElementById('saveExpenseBtn');

    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Saving...';

    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json();
            const message = errData.errors ? errData.errors.join(', ') : (errData.message || 'Validation error');
            throw new Error(message);
        }

        const createdExpense = await response.json();

        // Success!
        showToast(`Added: ${createdExpense.description} (${formatINR(createdExpense.amount)})`, 'success');

        // Reset form fields
        if (prefix === 'modal') {
            modalAddFormEl.reset();
            document.getElementById('modalDate').value = getTodayDateString();
            closeModal(addExpenseModalEl);
        } else {
            quickAddFormEl.reset();
            document.getElementById('quickDate').value = getTodayDateString();
        }

        // Refresh dashboard metrics and table
        await loadDashboardData();

    } catch (err) {
        console.error('Error adding expense:', err);
        if (prefix === 'modal') {
            modalFormAlertEl.textContent = err.message;
            modalFormAlertEl.style.display = 'block';
        } else {
            showToast(err.message, 'error');
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

/**
 * Initiates the delete confirmation dialog for a given expense ID.
 */
function promptDeleteExpense(id) {
    const expense = currentExpenses.find(e => e.id === id);
    if (!expense) return;

    pendingDeleteId = id;
    deleteExpenseDescEl.textContent = expense.description;
    deleteExpenseAmtEl.textContent = formatINR(expense.amount);

    openModal(deleteConfirmModalEl);
}

/**
 * Calls DELETE /api/expenses/{id} when confirmed.
 */
async function executeDelete() {
    if (!pendingDeleteId) return;

    confirmDeleteBtnEl.disabled = true;
    confirmDeleteBtnEl.textContent = 'Deleting...';

    try {
        const response = await fetch(`${API_BASE_URL}/${pendingDeleteId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Failed to delete expense (HTTP ${response.status})`);
        }

        showToast('Expense removed successfully', 'info');
        closeModal(deleteConfirmModalEl);
        pendingDeleteId = null;

        // Refresh dashboard metrics and table
        await loadDashboardData();

    } catch (err) {
        console.error('Error deleting expense:', err);
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
 * Populates top summary metric cards.
 */
function renderSummaryMetrics(summary) {
    totalExpensesEl.textContent = formatINR(summary.totalExpenses || 0);
    totalCountBadgeEl.textContent = `${summary.totalTransactions || 0} transaction${summary.totalTransactions === 1 ? '' : 's'}`;

    todayExpensesEl.textContent = formatINR(summary.todayExpenses || 0);
    monthExpensesEl.textContent = formatINR(summary.thisMonthExpenses || 0);

    // Monthly Salary & Savings Tracker
    const salary = summary.monthlySalary || currentMonthlySalary;
    currentMonthlySalary = salary;
    const spentThisMonth = summary.thisMonthExpenses || 0;
    const remaining = summary.remainingSalary !== undefined ? summary.remainingSalary : (salary - spentThisMonth);
    const spentPct = summary.salarySpentPercentage !== undefined ? summary.salarySpentPercentage : (salary > 0 ? (spentThisMonth / salary) * 100 : 0);

    displayMonthlySalaryEl.textContent = formatINR(salary);
    displaySalarySpentEl.textContent = formatINR(spentThisMonth);
    displaySpentPctLabelEl.textContent = `${spentPct.toFixed(1)}% of salary spent`;
    displayRemainingSalaryEl.textContent = formatINR(remaining);

    // Visual Salary Utilization Progress Bar
    const progressFillWidth = Math.min(Math.max(spentPct, 0), 100);
    salaryProgressFillEl.style.width = `${progressFillWidth}%`;
    salaryProgressTextEl.textContent = `${formatINR(spentThisMonth)} spent of ${formatINR(salary)}`;

    const remainingPct = Math.max(100 - spentPct, 0);
    salaryRemainingPctTextEl.textContent = `${remainingPct.toFixed(1)}% savings remaining`;

    // Dynamic color coding based on budget utilization
    if (spentPct > 100) {
        salaryStatusBadgeEl.className = 'salary-status-badge badge-danger';
        salaryStatusBadgeEl.textContent = 'Over Budget';
        displayRemainingSalaryEl.className = 'salary-metric-value text-overbudget';
        salaryProgressFillEl.style.background = '#ef4444';
    } else if (spentPct > 75) {
        salaryStatusBadgeEl.className = 'salary-status-badge badge-warning';
        salaryStatusBadgeEl.textContent = 'Caution (>75%)';
        displayRemainingSalaryEl.className = 'salary-metric-value';
        salaryProgressFillEl.style.background = '#f59e0b';
    } else {
        salaryStatusBadgeEl.className = 'salary-status-badge badge-safe';
        salaryStatusBadgeEl.textContent = 'On Track';
        displayRemainingSalaryEl.className = 'salary-metric-value text-remaining';
        salaryProgressFillEl.style.background = 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)';
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
        topCategoryNameEl.textContent = `${icon} ${topCat}`;
        topCategoryAmountEl.textContent = formatINR(maxVal);
    } else {
        topCategoryNameEl.textContent = '—';
        topCategoryAmountEl.textContent = '₹0.00';
    }
}

/**
 * Renders the transactions table rows or displays the empty state message.
 */
function renderExpensesTable(expenses, selectedCategory) {
    expensesTableBodyEl.innerHTML = '';

    if (!expenses || expenses.length === 0) {
        // Show empty state
        transactionTableEl.style.display = 'none';
        emptyStateEl.style.display = 'flex';

        if (selectedCategory && selectedCategory !== 'All') {
            emptyStateTitleEl.textContent = `No Expenses in "${selectedCategory}"`;
            emptyStateMessageEl.textContent = `There are no recorded expenses under "${selectedCategory}". Try selecting another category or add a new expense!`;
        } else {
            emptyStateTitleEl.textContent = 'No Expenses Recorded Yet';
            emptyStateMessageEl.textContent = 'Your expense list is currently empty. Record your first transaction to start tracking your budget!';
        }
        return;
    }

    // Hide empty state and show table
    transactionTableEl.style.display = 'table';
    emptyStateEl.style.display = 'none';

    expenses.forEach(item => {
        const tr = document.createElement('tr');

        // Formatted Date
        const dateCell = document.createElement('td');
        dateCell.className = 'date-cell';
        dateCell.textContent = formatDate(item.date);
        tr.appendChild(dateCell);

        // Description
        const descCell = document.createElement('td');
        descCell.className = 'desc-cell';
        descCell.textContent = item.description;
        tr.appendChild(descCell);

        // Category Badge
        const catCell = document.createElement('td');
        const catConfig = CATEGORY_CONFIG[item.category] || { color: 'badge-other', icon: '🏷️' };
        catCell.innerHTML = `<span class="badge ${catConfig.color}">${catConfig.icon} ${escapeHtml(item.category)}</span>`;
        tr.appendChild(catCell);

        // Amount (INR ₹)
        const amtCell = document.createElement('td');
        amtCell.className = 'amount-cell text-right';
        amtCell.textContent = formatINR(item.amount);
        tr.appendChild(amtCell);

        // Action (Delete button)
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
 * Renders the category breakdown list and visual progress bar meter.
 */
function renderCategoryBreakdown(summary) {
    categoryBreakdownListEl.innerHTML = '';
    distributionMeterEl.innerHTML = '';

    const breakdown = summary.categoryBreakdown || {};
    const percentages = summary.categoryPercentages || {};
    const categories = Object.keys(breakdown);

    if (categories.length === 0 || (summary.totalExpenses && summary.totalExpenses <= 0)) {
        emptyCategoryHintEl.style.display = 'block';
        distributionMeterEl.style.display = 'none';
        return;
    }

    emptyCategoryHintEl.style.display = 'none';
    distributionMeterEl.style.display = 'flex';

    // Sort categories descending by amount
    categories.sort((a, b) => breakdown[b] - breakdown[a]);

    categories.forEach(cat => {
        const amt = breakdown[cat];
        const pct = percentages[cat] || 0;
        const config = CATEGORY_CONFIG[cat] || { hex: '#64748b', icon: '🏷️' };

        // 1. Add segment to the visual distribution meter
        const meterSegment = document.createElement('div');
        meterSegment.className = 'meter-segment';
        meterSegment.style.width = `${pct}%`;
        meterSegment.style.backgroundColor = config.hex;
        meterSegment.title = `${cat}: ${formatINR(amt)} (${pct}%)`;
        distributionMeterEl.appendChild(meterSegment);

        // 2. Add detailed row in category breakdown list
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
// Modal & Toast Helper Functions
// ============================================================================

function openModal(modalEl) {
    modalEl.classList.add('show');
    modalEl.setAttribute('aria-hidden', 'false');
    // Clear any previous error styling
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
 * Displays floating feedback toast alert.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
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

    // Auto-remove toast after 3.5 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
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
 * Formats a numeric or string amount into Indian Rupees (INR) with the ₹ symbol.
 * Uses standard Indian grouping: ₹1,25,000.00
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
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const date = new Date(year, month, day);
            return date.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }
        return dateStr;
    } catch {
        return dateStr;
    }
}

/**
 * Returns today's date formatted as YYYY-MM-DD for HTML <input type="date">
 */
function getTodayDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Escapes HTML characters to prevent XSS.
 */
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
