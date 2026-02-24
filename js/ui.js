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
        this.setupClearStorage();
        this.setupExportButtons();
        this.setupImportButtons();
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
                totalRideDistance: parseFloat(document.getElementById('grossFare').value),
                totalIncome: parseFloat(document.getElementById('commission').value),
                numberOfTrips: parseInt(document.getElementById('tripCount').value)
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
        
        if (!tbody) return; // Safety check

        tbody.innerHTML = '';

        if (!earnings || earnings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #999;">No earnings recorded yet</td></tr>';
            return;
        }

        earnings.forEach(earning => {
            try {
                // Validate earning data
                const date = earning.date || 'N/A';
                const distance = parseFloat(earning.totalRideDistance) || 0;
                const income = parseFloat(earning.totalIncome) || 0;
                const trips = parseInt(earning.numberOfTrips) || 0;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${date}</td>
                    <td>${distance.toFixed(1)} km</td>
                    <td>₨ ${income.toFixed(2)}</td>
                    <td>${trips}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>
                        <button class="btn-edit" onclick="UI.openEditEarningsModal('${earning.id}')">Edit</button>
                        <button class="btn-delete" onclick="UI.deleteEarning('${earning.id}')">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            } catch (e) {
                console.error('Error rendering earning row:', e, earning);
            }
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
        
        if (!tbody) return; // Safety check
        
        tbody.innerHTML = '';

        if (!expenses || expenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">No expenses recorded yet</td></tr>';
            return;
        }

        expenses.forEach(expense => {
            try {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${expense.date || 'N/A'}</td>
                    <td>${this.getCategoryLabel(expense.category)}</td>
                    <td>₨ ${parseFloat(expense.amount || 0).toFixed(2)}</td>
                    <td><span class="badge badge-${expense.type}">${expense.type}</span></td>
                    <td>${expense.notes || ''}</td>
                    <td>
                        <button class="btn-edit" onclick="UI.openEditExpenseModal('${expense.id}')">Edit</button>
                        <button class="btn-delete" onclick="UI.deleteExpense('${expense.id}')">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            } catch (e) {
                console.error('Error rendering expense row:', e, expense);
            }
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
        // Mileage is now tracked via ride distance in earnings
        // This function is kept for backward compatibility
        return;
    },

    deleteMileage(id) {
        // Mileage deletion is deprecated
        return;
    },

    // Config Form
    setupConfigForm() {
        const form = document.getElementById('configForm');
        const config = Storage.getConfig();

        document.getElementById('driverPassCostPerDay').value = config.driverPassCostPerDay || 999;
        document.getElementById('driverPassActivationDate').value = config.driverPassActivationDate || new Date().toISOString().split('T')[0];
        document.getElementById('fuelConsumptionRate').value = config.fuelConsumptionRate || 13;
        document.getElementById('fuelPricePerLiter').value = config.fuelPricePerLiter || 250;
        
        const maintenanceCostField = document.getElementById('maintenanceCost');
        if (maintenanceCostField) {
            maintenanceCostField.value = config.maintenanceCostPerKm || 10;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const newConfig = {
                driverPassCostPerDay: parseFloat(document.getElementById('driverPassCostPerDay').value),
                driverPassActivationDate: document.getElementById('driverPassActivationDate').value,
                fuelConsumptionRate: parseFloat(document.getElementById('fuelConsumptionRate').value),
                fuelPricePerLiter: parseFloat(document.getElementById('fuelPricePerLiter').value),
                maintenanceCostPerKm: maintenanceCostField ? parseFloat(maintenanceCostField.value) : 10
            };

            Storage.setConfig(newConfig);
            alert('Settings saved successfully!');
        });
    },

    // Setup Clear Storage
    setupClearStorage() {
        const clearBtn = document.getElementById('clearStorageBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('⚠️  Are you absolutely sure? This will delete ALL saved data (earnings, expenses, settings). This action cannot be undone.')) {
                    if (confirm('Click OK again to confirm you want to delete everything.')) {
                        Storage.clearAll();
                        this.renderAllData();
                        alert('✓ All data has been cleared successfully!');
                    }
                }
            });
        }
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

        // Update summary cards with new metrics
        document.getElementById('totalRevenue').textContent = `₨ ${summary.totalRideIncome.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = `₨ ${(summary.totalFuelCost + summary.allocatedDriverPassCost + summary.totalMaintenanceCost).toFixed(2)}`;
        document.getElementById('netProfit').textContent = `₨ ${summary.trueNetProfit.toFixed(2)}`;
        document.getElementById('profitMargin').textContent = `${summary.totalRideIncome > 0 ? ((summary.trueNetProfit / summary.totalRideIncome) * 100).toFixed(2) : 0}%`;

        // Update metrics for new model
        document.getElementById('totalKm').textContent = `${summary.totalRideDistance.toFixed(1)} km`;
        document.getElementById('costPerKm').textContent = `₨ ${summary.totalRideDistance > 0 ? ((summary.totalFuelCost + summary.totalMaintenanceCost) / summary.totalRideDistance).toFixed(2) : 0}`;
        document.getElementById('profitPerKm').textContent = `₨ ${summary.profitPerKm.toFixed(2)}`;
        document.getElementById('hourlyProfit').textContent = `₨ ${summary.profitPerDay.toFixed(2)} / day`;

        // Show additional metrics
        this.renderNewMetricsBreakdown(summary);
    },

    // Render new metrics breakdown
    renderNewMetricsBreakdown(summary) {
        const container = document.getElementById('expenseBreakdown');
        container.innerHTML = '';

        const totalCosts = summary.totalFuelCost + summary.totalMaintenanceCost + summary.allocatedDriverPassCost;
        const items = `
            <div class="breakdown-item income-row" style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 2px solid #3b82f6;">
                <span><strong>Income</strong></span>
                <span style="color: #10b981;"><strong>₨ ${summary.totalRideIncome.toFixed(2)}</strong></span>
            </div>
            <div class="breakdown-item" style="margin-top: 10px;">
                <span>Fuel Cost (@ ₨${(summary.totalFuelCost / Math.max(summary.totalRideDistance, 1)).toFixed(2)}/km)</span>
                <span>-₨ ${summary.totalFuelCost.toFixed(2)}</span>
            </div>
            <div class="breakdown-item">
                <span>Maintenance (@ ₨${(summary.totalMaintenanceCost / Math.max(summary.totalRideDistance, 1)).toFixed(2)}/km)</span>
                <span>-₨ ${summary.totalMaintenanceCost.toFixed(2)}</span>
            </div>
            <div class="breakdown-item" style="margin-bottom: 10px;">
                <span>Driver Pass</span>
                <span>-₨ ${summary.allocatedDriverPassCost.toFixed(2)}</span>
            </div>
            <div class="breakdown-item" style="padding: 12px 0; border-top: 2px solid #e2e8f0; border-bottom: 2px solid #e2e8f0; font-weight: 600; margin-bottom: 10px;">
                <span>Total Costs</span>
                <span>-₨ ${totalCosts.toFixed(2)}</span>
            </div>
            <div class="breakdown-item total" style="margin-top: 10px;">
                <span>Net Profit</span>
                <span style="color: #10b981; font-weight: 700;">₨ ${summary.trueNetProfit.toFixed(2)}</span>
            </div>
        `;

        container.innerHTML = items;
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

    // Setup Import Buttons
    setupImportButtons() {
        const importEarningsBtn = document.getElementById('importEarningsBtn');
        const importEarningsFile = document.getElementById('importEarningsFile');
        const importExpensesBtn = document.getElementById('importExpensesBtn');
        const importExpensesFile = document.getElementById('importExpensesFile');

        if (importEarningsBtn && importEarningsFile) {
            importEarningsBtn.addEventListener('click', () => {
                importEarningsFile.click();
            });

            importEarningsFile.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    Exporter.importEarnings(e.target.files[0]);
                    // Reset file input
                    e.target.value = '';
                }
            });
        }

        if (importExpensesBtn && importExpensesFile) {
            importExpensesBtn.addEventListener('click', () => {
                importExpensesFile.click();
            });

            importExpensesFile.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    Exporter.importExpenses(e.target.files[0]);
                    // Reset file input
                    e.target.value = '';
                }
            });
        }
    },

    // Setup Edit Forms
    setupEditForms() {
        // Edit Earnings Form
        document.getElementById('editEarningsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('editEarningsId').value;
            const earning = {
                date: document.getElementById('editEarningsDate').value,
                totalRideDistance: parseFloat(document.getElementById('editGrossFare').value),
                totalIncome: parseFloat(document.getElementById('editCommission').value),
                numberOfTrips: parseInt(document.getElementById('editTripCount').value)
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

        // Edit Mileage Form (stub - mileage removed from new model)
        if (document.getElementById('editMileageForm')) {
            document.getElementById('editMileageForm').addEventListener('submit', (e) => {
                e.preventDefault();
                alert('Mileage tracking is no longer used. Use ride distance in earnings instead.');
                this.closeModal('editMileageModal');
            });
        }
    },

    // Open Edit Modal Functions
    openEditEarningsModal(id) {
        const earnings = Storage.getEarnings();
        const earning = earnings.find(e => e.id === id);
        
        if (earning) {
            document.getElementById('editEarningsId').value = id;
            document.getElementById('editEarningsDate').value = earning.date;
            document.getElementById('editGrossFare').value = earning.totalRideDistance;
            document.getElementById('editCommission').value = earning.totalIncome;
            document.getElementById('editTripCount').value = earning.numberOfTrips;
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
        // Mileage editing is deprecated - track distance via earnings instead
        alert('Mileage tracking is no longer used. Use ride distance in the Earnings tab instead.');
    },

    // Render all data on page load
    renderAllData() {
        this.renderEarningsTable();
        this.renderExpenseTable();
        this.updateSummary();
    }
};
