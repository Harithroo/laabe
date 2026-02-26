/**
 * Storage Module
 * Handles localStorage operations for earnings, expenses, and config
 */

const Storage = {
    defaultDriverPassActivationDate: '2026-02-24',

    keys: {
        config: 'config',
        earnings: 'earnings',
        expenses: 'expenses',
        mileage: 'mileage'
    },

    // Initialize default config
    initDefaults() {
        // Migrate from old data format if needed
        this.migrateOldData();

        const existingConfig = this.get(this.keys.config);
        if (!existingConfig) {
            this.set(this.keys.config, {
                driverPassCostPerDay: 999,      // LKR per day
                driverPassActivationDate: this.defaultDriverPassActivationDate, // Date pass starts charging (first day excluded)
                fuelConsumptionRate: 13,        // km per liter
                fuelPricePerLiter: 250,         // LKR per liter
                maintenanceCostPerKm: 10        // LKR per km (typical: 8-15)
            });
        } else if (existingConfig.driverPassActivationDate === '2026-02-23') {
            this.set(this.keys.config, {
                ...existingConfig,
                driverPassActivationDate: this.defaultDriverPassActivationDate
            });
        }
        if (!this.get(this.keys.earnings)) {
            this.set(this.keys.earnings, []);
        }
        if (!this.get(this.keys.expenses)) {
            this.set(this.keys.expenses, []);
        }
        if (!this.get(this.keys.mileage)) {
            this.set(this.keys.mileage, []);
        }
    },

    // Migrate old data format to new format
    migrateOldData() {
        try {
            const oldEarnings = this.get(this.keys.earnings);
            if (oldEarnings && oldEarnings.length > 0) {
                const firstEarning = oldEarnings[0];
                // Check if it's old format (has grossFare, commission, etc.)
                if (firstEarning.grossFare !== undefined && firstEarning.totalRideDistance === undefined) {
                    console.log('Migrating old earnings format...');
                    const migrated = oldEarnings.map((entry) => ({
                        id: entry.id || this.generateId(),
                        date: entry.date || new Date().toISOString().split('T')[0],
                        totalRideDistance: parseFloat(entry.grossFare) || 0,
                        totalIncome: parseFloat(entry.commission) || 0,
                        numberOfTrips: parseInt(entry.tripCount) || 1
                    }));
                    this.set(this.keys.earnings, migrated);
                }
            }
        } catch (e) {
            console.error('Error during migration:', e);
        }
    },

    generateId() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
        const earnings = this.get(this.keys.earnings) || [];
        earning.id = this.generateId();
        earnings.push(earning);
        this.set(this.keys.earnings, earnings);
        return earning;
    },

    getEarnings() {
        return this.get(this.keys.earnings) || [];
    },

    deleteEarning(id) {
        let earnings = this.get(this.keys.earnings) || [];
        earnings = earnings.filter(e => e.id !== id);
        this.set(this.keys.earnings, earnings);
    },

    updateEarning(id, earning) {
        let earnings = this.get(this.keys.earnings) || [];
        earnings = earnings.map(e => e.id === id ? { ...earning, id } : e);
        this.set(this.keys.earnings, earnings);
    },

    // Expenses
    addExpense(expense) {
        const expenses = this.get(this.keys.expenses) || [];
        expense.id = this.generateId();
        expenses.push(expense);
        this.set(this.keys.expenses, expenses);
        return expense;
    },

    getExpenses() {
        return this.get(this.keys.expenses) || [];
    },

    deleteExpense(id) {
        let expenses = this.get(this.keys.expenses) || [];
        expenses = expenses.filter(e => e.id !== id);
        this.set(this.keys.expenses, expenses);
    },

    updateExpense(id, expense) {
        let expenses = this.get(this.keys.expenses) || [];
        expenses = expenses.map(e => e.id === id ? { ...expense, id } : e);
        this.set(this.keys.expenses, expenses);
    },

    // Mileage
    addMileage(mileage) {
        const mileageEntries = this.get(this.keys.mileage) || [];
        mileage.id = this.generateId();
        mileageEntries.push(mileage);
        this.set(this.keys.mileage, mileageEntries);
        return mileage;
    },

    getMileage() {
        return this.get(this.keys.mileage) || [];
    },

    deleteMileage(id) {
        let mileageEntries = this.get(this.keys.mileage) || [];
        mileageEntries = mileageEntries.filter(m => m.id !== id);
        this.set(this.keys.mileage, mileageEntries);
    },

    updateMileage(id, mileage) {
        let mileageEntries = this.get(this.keys.mileage) || [];
        mileageEntries = mileageEntries.map(m => m.id === id ? { ...mileage, id } : m);
        this.set(this.keys.mileage, mileageEntries);
    },

    // Config
    getConfig() {
        return this.get(this.keys.config) || {
            driverPassCostPerDay: 999,
            driverPassActivationDate: this.defaultDriverPassActivationDate,
            fuelConsumptionRate: 13,
            fuelPricePerLiter: 250,
            maintenanceCostPerKm: 10
        };
    },

    setConfig(config) {
        this.set(this.keys.config, config);
    },

    // Clear all data
    clearAll() {
        localStorage.removeItem(this.keys.config);
        localStorage.removeItem(this.keys.earnings);
        localStorage.removeItem(this.keys.expenses);
        localStorage.removeItem(this.keys.mileage);
        this.initDefaults();
    }
};

// Initialize on load
Storage.initDefaults();
