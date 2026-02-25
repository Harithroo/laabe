/**
 * Storage Module
 * Handles localStorage operations for earnings, expenses, and config
 */

const Storage = {
    // Initialize default config
    initDefaults() {
        // Migrate from old data format if needed
        this.migrateOldData();

        if (!this.get('config')) {
            const today = new Date().toISOString().split('T')[0];
            this.set('config', {
                driverPassCostPerDay: 999,      // LKR per day
                driverPassActivationDate: today,// Date pass starts charging
                fuelConsumptionRate: 13,        // km per liter
                fuelPricePerLiter: 250,         // LKR per liter
                maintenanceCostPerKm: 10        // LKR per km (typical: 8-15)
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

    // Migrate old data format to new format
    migrateOldData() {
        try {
            const oldEarnings = this.get('earnings');
            if (oldEarnings && oldEarnings.length > 0) {
                const firstEarning = oldEarnings[0];
                // Check if it's old format (has grossFare, commission, etc.)
                if (firstEarning.grossFare !== undefined && firstEarning.totalRideDistance === undefined) {
                    console.log('Migrating old earnings format...');
                    // Old format detected, clear it - user should re-enter with new format
                    this.set('earnings', []);
                }
            }
        } catch (e) {
            console.error('Error during migration:', e);
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
        const mileageEntries = this.get('mileage') || [];
        mileage.id = Date.now().toString();
        mileageEntries.push(mileage);
        this.set('mileage', mileageEntries);
        return mileage;
    },

    getMileage() {
        return this.get('mileage') || [];
    },

    deleteMileage(id) {
        let mileageEntries = this.get('mileage') || [];
        mileageEntries = mileageEntries.filter(m => m.id !== id);
        this.set('mileage', mileageEntries);
    },

    updateMileage(id, mileage) {
        let mileageEntries = this.get('mileage') || [];
        mileageEntries = mileageEntries.map(m => m.id === id ? { ...mileage, id } : m);
        this.set('mileage', mileageEntries);
    },

    // Config
    getConfig() {
        const today = new Date().toISOString().split('T')[0];
        return this.get('config') || {
            driverPassCostPerDay: 999,
            driverPassActivationDate: today,
            fuelConsumptionRate: 13,
            fuelPricePerLiter: 250,
            maintenanceCostPerKm: 10
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
