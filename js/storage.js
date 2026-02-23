/**
 * Storage Module
 * Handles localStorage operations for earnings, expenses, mileage, and config
 */

const Storage = {
    // Initialize default config
    initDefaults() {
        if (!this.get('config')) {
            this.set('config', {
                fuelPrice: 0,
                kmPerLiter: 0,
                serviceInterval: 10000
            });
        }
        if (!this.get('earnings')) {
            this.set('earnings', []);
        }
        if (!this.get('expenses')) {
            this.set('expenses', []);
        }
        if (!this.get('mileage')) {
            this.set('mileage', []);
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

    // Mileage
    addMileage(mileage) {
        const mileages = this.get('mileage') || [];
        mileage.id = Date.now().toString();
        mileages.push(mileage);
        this.set('mileage', mileages);
        return mileage;
    },

    getMileage() {
        return this.get('mileage') || [];
    },

    deleteMileage(id) {
        let mileages = this.get('mileage') || [];
        mileages = mileages.filter(m => m.id !== id);
        this.set('mileage', mileages);
    },

    updateMileage(id, mileage) {
        let mileages = this.get('mileage') || [];
        mileages = mileages.map(m => m.id === id ? { ...mileage, id } : m);
        this.set('mileage', mileages);
    },

    // Config
    getConfig() {
        return this.get('config') || {
            fuelPrice: 0,
            kmPerLiter: 0,
            serviceInterval: 10000
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
