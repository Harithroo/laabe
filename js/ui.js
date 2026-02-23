/**
 * UI Module
 * Handles all DOM manipulation and rendering
 */

const UI = {
    // Initialize all event listeners
    init() {
        this.setupTabNavigation();
        this.setupEarningsForm();
        this.setupExpenseForm();
        this.setupMileageForm();
        this.setupConfigForm();
        this.setupExportButtons();
        this.setupSummaryMonth();
        this.setupEditForms();
        this.setupModalClosers();
        this.renderAllData();
    },

    // Modal Functions
    openModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    },

    setupModalClosers() {
        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });
    },

    // Tab Navigation
    setupTabNavigation() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    },

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active state from buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(tabName).classList.add('active');

        // Set active button
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Load summary data if switching to summary tab
        if (tabName === 'summary') {
            this.updateSummary();
        }
    },

    // Earnings Form
    setupEarningsForm() {
        const form = document.getElementById('earningsForm');
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('earningsDate').value = today;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const earning = {
                date: document.getElementById('earningsDate').value,
                grossFare: parseFloat(document.getElementById('grossFare').value),
                commission: parseFloat(document.getElementById('commission').value),
                tips: parseFloat(document.getElementById('tips').value) || 0,
                tripCount: parseInt(document.getElementById('tripCount').value),
                onlineHours: parseFloat(document.getElementById('onlineHours').value)
            };

            Storage.addEarning(earning);
            form.reset();
            document.getElementById('earningsDate').value = today;
            this.renderEarningsTable();
            alert('Earning added successfully!');
        });
    },

    // Render Earnings Table
    renderEarningsTable() {
        const earnings = Storage.getEarnings();
        const tbody = document.querySelector('#earningsTable tbody');
        tbody.innerHTML = '';

        if (earnings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">No earnings recorded yet</td></tr>';
            return;
        }

        earnings.forEach(earning => {
            const netEarned = earning.grossFare - earning.commission + earning.tips;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${earning.date}</td>
                <td>₨ ${earning.grossFare.toFixed(2)}</td>
                <td>₨ ${earning.commission.toFixed(2)}</td>
                <td>₨ ${earning.tips.toFixed(2)}</td>
                <td><strong>₨ ${netEarned.toFixed(2)}</strong></td>
                <td>${earning.tripCount}</td>
                <td>${earning.onlineHours}</td>
                <td>
                    <button class="btn-edit" onclick="UI.openEditEarningsModal('${earning.id}')">Edit</button>
                    <button class="btn-delete" onclick="UI.deleteEarning('${earning.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    deleteEarning(id) {
        if (confirm('Are you sure you want to delete this earning?')) {
            Storage.deleteEarning(id);
            this.renderEarningsTable();
        }
    },

    // Expense Form
    setupExpenseForm() {
        const form = document.getElementById('expenseForm');
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('expenseDate').value = today;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const expense = {
                date: document.getElementById('expenseDate').value,
                category: document.getElementById('expenseCategory').value,
                amount: parseFloat(document.getElementById('expenseAmount').value),
                type: document.getElementById('expenseType').value,
                odometer: document.getElementById('expenseOdometer').value || null,
                notes: document.getElementById('expenseNotes').value || ''
            };

            Storage.addExpense(expense);
            form.reset();
            document.getElementById('expenseDate').value = today;
            this.renderExpenseTable();
            alert('Expense added successfully!');
        });
    },

    // Render Expense Table
    renderExpenseTable() {
        const expenses = Storage.getExpenses();
        const tbody = document.querySelector('#expenseTable tbody');
        tbody.innerHTML = '';

        if (expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No expenses recorded yet</td></tr>';
            return;
        }

        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${expense.date}</td>
                <td>${this.getCategoryLabel(expense.category)}</td>
                <td>₨ ${expense.amount.toFixed(2)}</td>
                <td><span class="badge badge-${expense.type}">${expense.type}</span></td>
                <td>${expense.notes}</td>
                <td>
                    <button class="btn-edit" onclick="UI.openEditExpenseModal('${expense.id}')">Edit</button>
                    <button class="btn-delete" onclick="UI.deleteExpense('${expense.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            Storage.deleteExpense(id);
            this.renderExpenseTable();
        }
    },

    getCategoryLabel(category) {
        const labels = {
            'fuel': 'Fuel',
            'parking': 'Parking',
            'tolls': 'Tolls',
            'carwash': 'Car Wash',
            'insurance': 'Insurance',
            'lease': 'Lease/Loan',
            'license': 'Vehicle License',
            'internet': 'Internet',
            'maintenance': 'Maintenance',
            'repairs': 'Repairs',
            'tires': 'Tires',
            'battery': 'Battery',
            'engine': 'Engine Work',
            'other': 'Other'
        };
        return labels[category] || category;
    },

    // Mileage Form
    setupMileageForm() {
        const form = document.getElementById('mileageForm');
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('mileageDate').value = today;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const start = parseFloat(document.getElementById('odometerStart').value);
            const end = parseFloat(document.getElementById('odometerEnd').value);

            if (end <= start) {
                alert('Odometer end must be greater than start!');
                return;
            }

            const mileage = {
                date: document.getElementById('mileageDate').value,
                odometerStart: start,
                odometerEnd: end
            };

            Storage.addMileage(mileage);
            form.reset();
            document.getElementById('mileageDate').value = today;
            this.renderMileageTable();
            alert('Mileage added successfully!');
        });
    },

    // Render Mileage Table
    renderMileageTable() {
        const mileages = Storage.getMileage();
        const tbody = document.querySelector('#mileageTable tbody');
        tbody.innerHTML = '';

        if (mileages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999;">No mileage recorded yet</td></tr>';
            return;
        }

        mileages.forEach(mileage => {
            const distance = mileage.odometerEnd - mileage.odometerStart;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${mileage.date}</td>
                <td>${mileage.odometerStart.toFixed(1)}</td>
                <td>${mileage.odometerEnd.toFixed(1)}</td>
                <td><strong>${distance.toFixed(1)}</strong></td>
                <td>
                    <button class="btn-edit" onclick="UI.openEditMileageModal('${mileage.id}')">Edit</button>
                    <button class="btn-delete" onclick="UI.deleteMileage('${mileage.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    },

    deleteMileage(id) {
        if (confirm('Are you sure you want to delete this mileage record?')) {
            Storage.deleteMileage(id);
            this.renderMileageTable();
        }
    },

    // Config Form
    setupConfigForm() {
        const form = document.getElementById('configForm');
        const config = Storage.getConfig();

        document.getElementById('fuelPrice').value = config.fuelPrice;
        document.getElementById('kmPerLiter').value = config.kmPerLiter;
        document.getElementById('serviceInterval').value = config.serviceInterval;

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const newConfig = {
                fuelPrice: parseFloat(document.getElementById('fuelPrice').value),
                kmPerLiter: parseFloat(document.getElementById('kmPerLiter').value),
                serviceInterval: parseFloat(document.getElementById('serviceInterval').value)
            };

            Storage.setConfig(newConfig);
            alert('Settings saved successfully!');
        });
    },

    // Setup Summary Month Picker
    setupSummaryMonth() {
        const input = document.getElementById('summaryMonth');
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        input.value = `${year}-${month}`;

        input.addEventListener('change', () => {
            this.updateSummary();
        });
    },

    // Update Summary
    updateSummary() {
        const input = document.getElementById('summaryMonth').value;
        if (!input) return;

        const [year, month] = input.split('-');
        const yearNum = parseInt(year);
        const monthNum = parseInt(month) - 1;

        const summary = Calculations.getMonthlySummary(yearNum, monthNum);

        // Update summary cards
        document.getElementById('totalRevenue').textContent = `₨ ${summary.totalRevenue.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = `₨ ${summary.totalExpenses.toFixed(2)}`;
        document.getElementById('netProfit').textContent = `₨ ${summary.netProfit.toFixed(2)}`;
        document.getElementById('profitMargin').textContent = `${summary.profitMargin.toFixed(2)}%`;

        // Update metrics
        document.getElementById('totalKm').textContent = `${summary.totalKm.toFixed(1)} km`;
        document.getElementById('costPerKm').textContent = `₨ ${summary.costPerKm.toFixed(2)}`;
        document.getElementById('profitPerKm').textContent = `₨ ${summary.profitPerKm.toFixed(2)}`;
        document.getElementById('hourlyProfit').textContent = `₨ ${summary.hourlyProfit.toFixed(2)}`;

        // Update expense breakdown
        this.renderExpenseBreakdown(summary.expensesByCategory);
    },

    // Render Expense Breakdown
    renderExpenseBreakdown(breakdown) {
        const container = document.getElementById('expenseBreakdown');
        container.innerHTML = '';

        if (Object.keys(breakdown).length === 0) {
            container.innerHTML = '<p style="color: #999;">No expenses recorded for this month</p>';
            return;
        }

        const items = Object.entries(breakdown)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => {
                return `
                    <div class="breakdown-item">
                        <span>${this.getCategoryLabel(category)}</span>
                        <span>₨ ${amount.toFixed(2)}</span>
                    </div>
                `;
            })
            .join('');

        const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

        container.innerHTML = items + `
            <div class="breakdown-item total">
                <span>Total Expenses</span>
                <span>₨ ${total.toFixed(2)}</span>
            </div>
        `;
    },

    // Setup Export Buttons
    setupExportButtons() {
        document.getElementById('exportEarnings').addEventListener('click', () => {
            Exporter.exportEarnings();
        });

        document.getElementById('exportExpenses').addEventListener('click', () => {
            Exporter.exportExpenses();
        });

        document.getElementById('exportSummary').addEventListener('click', () => {
            const input = document.getElementById('summaryMonth').value;
            if (!input) {
                alert('Please select a month first');
                return;
            }
            const [year, month] = input.split('-');
            Exporter.exportSummary(parseInt(year), parseInt(month) - 1);
        });
    },

    // Setup Edit Forms
    setupEditForms() {
        // Edit Earnings Form
        document.getElementById('editEarningsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('editEarningsId').value;
            const earning = {
                date: document.getElementById('editEarningsDate').value,
                grossFare: parseFloat(document.getElementById('editGrossFare').value),
                commission: parseFloat(document.getElementById('editCommission').value),
                tips: parseFloat(document.getElementById('editTips').value) || 0,
                tripCount: parseInt(document.getElementById('editTripCount').value),
                onlineHours: parseFloat(document.getElementById('editOnlineHours').value)
            };
            Storage.updateEarning(id, earning);
            this.closeModal('editEarningsModal');
            this.renderEarningsTable();
            this.updateSummary();
            alert('Earning updated successfully!');
        });

        // Edit Expense Form
        document.getElementById('editExpenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('editExpenseId').value;
            const expense = {
                date: document.getElementById('editExpenseDate').value,
                category: document.getElementById('editExpenseCategory').value,
                amount: parseFloat(document.getElementById('editExpenseAmount').value),
                type: document.getElementById('editExpenseType').value,
                odometer: document.getElementById('editExpenseOdometer').value || null,
                notes: document.getElementById('editExpenseNotes').value || ''
            };
            Storage.updateExpense(id, expense);
            this.closeModal('editExpenseModal');
            this.renderExpenseTable();
            this.updateSummary();
            alert('Expense updated successfully!');
        });

        // Edit Mileage Form
        document.getElementById('editMileageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('editMileageId').value;
            const start = parseFloat(document.getElementById('editOdometerStart').value);
            const end = parseFloat(document.getElementById('editOdometerEnd').value);

            if (end <= start) {
                alert('Odometer end must be greater than start!');
                return;
            }

            const mileage = {
                date: document.getElementById('editMileageDate').value,
                odometerStart: start,
                odometerEnd: end
            };
            Storage.updateMileage(id, mileage);
            this.closeModal('editMileageModal');
            this.renderMileageTable();
            this.updateSummary();
            alert('Mileage updated successfully!');
        });
    },

    // Open Edit Modal Functions
    openEditEarningsModal(id) {
        const earnings = Storage.getEarnings();
        const earning = earnings.find(e => e.id === id);
        
        if (earning) {
            document.getElementById('editEarningsId').value = id;
            document.getElementById('editEarningsDate').value = earning.date;
            document.getElementById('editGrossFare').value = earning.grossFare;
            document.getElementById('editCommission').value = earning.commission;
            document.getElementById('editTips').value = earning.tips || 0;
            document.getElementById('editTripCount').value = earning.tripCount;
            document.getElementById('editOnlineHours').value = earning.onlineHours;
            this.openModal('editEarningsModal');
        }
    },

    openEditExpenseModal(id) {
        const expenses = Storage.getExpenses();
        const expense = expenses.find(e => e.id === id);
        
        if (expense) {
            document.getElementById('editExpenseId').value = id;
            document.getElementById('editExpenseDate').value = expense.date;
            document.getElementById('editExpenseCategory').value = expense.category;
            document.getElementById('editExpenseAmount').value = expense.amount;
            document.getElementById('editExpenseType').value = expense.type;
            document.getElementById('editExpenseOdometer').value = expense.odometer || '';
            document.getElementById('editExpenseNotes').value = expense.notes || '';
            this.openModal('editExpenseModal');
        }
    },

    openEditMileageModal(id) {
        const mileages = Storage.getMileage();
        const mileage = mileages.find(m => m.id === id);
        
        if (mileage) {
            document.getElementById('editMileageId').value = id;
            document.getElementById('editMileageDate').value = mileage.date;
            document.getElementById('editOdometerStart').value = mileage.odometerStart;
            document.getElementById('editOdometerEnd').value = mileage.odometerEnd;
            this.openModal('editMileageModal');
        }
    },

    // Render all data on page load
    renderAllData() {
        this.renderEarningsTable();
        this.renderExpenseTable();
        this.renderMileageTable();
        this.updateSummary();
    }
};
