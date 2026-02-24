/**
 * Storage Module
 * Handles localStorage operations for earnings, expenses, and config
 */

const Storage = {
    // Initialize default config
    initDefaults() {
        if (!this.get('config')) {
            this.set('config', {
                baseCommuteDistance: 16,      // km per day
                driverPassCost: 999,           // LKR per month
                fuelCostPerKm: 0,              // LKR per km
                maintenanceCostPerKm: 0        // LKR per km
            });
        }
        if (!this.get('earnings')) {
            this.set('earnings', []);
        }
        if (!this.get('expenses')) {
            this.set('expenses', []);
        }
    },

    // Generic set method
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    // Generic get method
    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    },

    // Earnings
    addEarning(earning) {
        const earnings = this.get('earnings') || [];
        earning.id = Date.now().toString();
        earnings.push(earning);
        this.set('earnings', earnings);
        return earning;
    },

    getEarnings() {
        return this.get('earnings') || [];
    },

    deleteEarning(id) {
        let earnings = this.get('earnings') || [];
        earnings = earnings.filter(e => e.id !== id);
        this.set('earnings', earnings);
    },

    updateEarning(id, earning) {
        let earnings = this.get('earnings') || [];
        earnings = earnings.map(e => e.id === id ? { ...earning, id } : e);
        this.set('earnings', earnings);
    },

    // Expenses
    addExpense(expense) {
        const expenses = this.get('expenses') || [];
        expense.id = Date.now().toString();
        expenses.push(expense);
        this.set('expenses', expenses);
        return expense;
    },

    getExpenses() {
        return this.get('expenses') || [];
    },

    deleteExpense(id) {
        let expenses = this.get('expenses') || [];
        expenses = expenses.filter(e => e.id !== id);
        this.set('expenses', expenses);
    },

    updateExpense(id, expense) {
        let expenses = this.get('expenses') || [];
        expenses = expenses.map(e => e.id === id ? { ...expense, id } : e);
        this.set('expenses', expenses);
    },

    // Mileage (removed - using totalRideDistance in earnings instead)

    // Config
    getConfig() {
        return this.get('config') || {
            baseCommuteDistance: 16,
            driverPassCost: 999,
            fuelCostPerKm: 0,
            maintenanceCostPerKm: 0
        };
    },

    setConfig(config) {
        this.set('config', config);
    },

    // Clear all data
    clearAll() {
        localStorage.clear();
        this.initDefaults();
    }
};

// Initialize on load
Storage.initDefaults();
