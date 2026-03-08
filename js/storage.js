/**
 * Storage Module
 * Handles localStorage operations for earnings, expenses, config, and passes
 */

const Storage = {
    keys: {
        config: 'config',
        earnings: 'earnings',
        expenses: 'expenses',
        mileage: 'mileage',
        passes: 'passes'
    },

    // Initialize default config
    initDefaults() {
        // Migrate from old data format if needed
        this.migrateOldData();

        const existingConfig = this.get(this.keys.config);
        if (!existingConfig) {
            this.set(this.keys.config, {
                fuelConsumptionRate: 12,        // km per liter
                fuelPricePerLiter: 292,         // LKR per liter
                maintenanceCostPerKm: 10        // LKR per km (typical: 8-15)
            });
        } else {
            // Remove pass-related fields if they exist
            this.set(this.keys.config, {
                fuelConsumptionRate: existingConfig.fuelConsumptionRate || 13,
                fuelPricePerLiter: existingConfig.fuelPricePerLiter || 250,
                maintenanceCostPerKm: existingConfig.maintenanceCostPerKm || 10
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
        if (!this.get(this.keys.passes)) {
            this.set(this.keys.passes, this.getDefaultPasses());
        } else {
            const passes = this.getPasses();
            this.set(this.keys.passes, passes);
        }
    },

    getDefaultPasses() {
        return {
            passTypes: {
                '4h': { label: '4 Hours', durationHours: 4, price: 559 },
                '24h': { label: '24 Hours', durationHours: 24, price: 999 },
                '3d': { label: '3 Days', durationHours: 72, price: 1999 }
            },
            activations: []
        };
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
                        numberOfTrips: parseInt(entry.tripCount) || 1,
                        app: this.normalizeApp(entry.app)
                    }));
                    this.set(this.keys.earnings, migrated);
                } else if (oldEarnings.some(entry => !entry.app)) {
                    // Backfill app field for existing records created before multi-app support
                    const backfilled = oldEarnings.map(entry => ({
                        ...entry,
                        app: this.normalizeApp(entry.app)
                    }));
                    this.set(this.keys.earnings, backfilled);
                }
            }
        } catch (e) {
            console.error('Error during migration:', e);
        }
    },

    normalizeApp(app) {
        const normalized = String(app || 'uber').trim().toLowerCase();
        if (normalized === 'hela go' || normalized === 'helago') return 'hela-go';
        return normalized || 'uber';
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
        earning.app = this.normalizeApp(earning.app);
        earnings.push(earning);
        this.set(this.keys.earnings, earnings);
        return earning;
    },

    getEarnings() {
        const earnings = this.get(this.keys.earnings) || [];
        return earnings.map(entry => ({
            ...entry,
            app: this.normalizeApp(entry.app)
        }));
    },

    deleteEarning(id) {
        let earnings = this.get(this.keys.earnings) || [];
        earnings = earnings.filter(e => e.id !== id);
        this.set(this.keys.earnings, earnings);
    },

    updateEarning(id, earning) {
        let earnings = this.get(this.keys.earnings) || [];
        earnings = earnings.map(e => e.id === id ? { ...earning, id, app: this.normalizeApp(earning.app) } : e);
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
            fuelConsumptionRate: 13,
            fuelPricePerLiter: 250,
            maintenanceCostPerKm: 10
        };
    },

    setConfig(config) {
        this.set(this.keys.config, config);
    },

    // Passes Management
    getPasses() {
        const defaults = this.getDefaultPasses();
        const raw = this.get(this.keys.passes);
        if (!raw) return defaults;

        const passTypes = {
            ...defaults.passTypes,
            ...(raw.passTypes || {})
        };

        // Migration: old format { passPrice, activatedDates[] } -> new { activations[] }
        let activations = [];
        if (Array.isArray(raw.activations)) {
            activations = raw.activations
                .filter(a => a && a.dateTime)
                .map(a => ({
                    id: a.id || this.generateId(),
                    dateTime: a.dateTime,
                    type: passTypes[a.type] ? a.type : '24h'
                }));
        } else if (Array.isArray(raw.activatedDates)) {
            const legacyType = raw.passPrice === 559 ? '4h' : raw.passPrice === 1999 ? '3d' : '24h';
            activations = raw.activatedDates.map((dateTime) => ({
                id: this.generateId(),
                dateTime,
                type: legacyType
            }));
        }

        activations.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
        return { passTypes, activations };
    },

    setPassPrice(price) {
        // Backwards-compatible method; now updates the 24h pass price.
        const passes = this.getPasses();
        passes.passTypes['24h'].price = parseFloat(price) || 999;
        this.set(this.keys.passes, passes);
    },

    addPassDate(date, type = '24h') {
        const passes = this.getPasses();
        const passType = passes.passTypes[type] ? type : '24h';
        const exists = passes.activations.some(a => a.dateTime === date && a.type === passType);
        if (!exists) {
            passes.activations.push({
                id: this.generateId(),
                dateTime: date,
                type: passType
            });
            passes.activations.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
            this.set(this.keys.passes, passes);
        }
    },

    removePassDate(date, type = null) {
        const passes = this.getPasses();
        passes.activations = passes.activations.filter(a => {
            if (type) {
                return !(a.dateTime === date && a.type === type);
            }
            return a.dateTime !== date;
        });
        this.set(this.keys.passes, passes);
    },

    // Clear all data
    clearAll() {
        localStorage.removeItem(this.keys.config);
        localStorage.removeItem(this.keys.earnings);
        localStorage.removeItem(this.keys.expenses);
        localStorage.removeItem(this.keys.mileage);
        localStorage.removeItem(this.keys.passes);
        this.initDefaults();
    }
};

// Initialize on load
Storage.initDefaults();
