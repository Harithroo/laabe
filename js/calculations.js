/**
 * Calculations Module
 * Handles all profit/loss calculations for Uber driving
 */

const Calculations = {
    normalizeApp(app) {
        const normalized = String(app || 'uber').trim().toLowerCase();
        if (normalized === 'hela go' || normalized === 'helago') return 'hela-go';
        return normalized;
    },

    getFuelPricePerLiterForDate(dateStr, config) {
        const date = String(dateStr || '').slice(0, 10);
        const fallback = parseFloat(config?.fuelPricePerLiter);
        const history = Array.isArray(config?.fuelPriceHistory) ? config.fuelPriceHistory : [];

        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || history.length === 0) {
            return Number.isFinite(fallback) && fallback > 0 ? fallback : 0;
        }

        let bestDate = null;
        let bestPrice = null;

        for (let i = 0; i < history.length; i++) {
            const effectiveDate = String(history[i]?.effectiveDate || '').slice(0, 10);
            const pricePerLiter = parseFloat(history[i]?.pricePerLiter);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate) || !Number.isFinite(pricePerLiter)) continue;
            if (effectiveDate > date) continue;

            if (!bestDate || effectiveDate > bestDate) {
                bestDate = effectiveDate;
                bestPrice = pricePerLiter;
            }
        }

        if (Number.isFinite(bestPrice) && bestPrice > 0) return bestPrice;

        return Number.isFinite(fallback) && fallback > 0 ? fallback : 0;
    },

    // Get earnings for a specific month
    getEarningsByMonth(year, month, appFilter = 'all') {
        const earnings = Storage.getEarnings();
        const app = this.normalizeApp(appFilter);
        return earnings.filter(e => {
            const date = new Date(e.date);
            const earningApp = this.normalizeApp(e.app);
            const matchesApp = app === 'all' ? true : earningApp === app;
            return date.getFullYear() === year && date.getMonth() === month && matchesApp;
        });
    },

    // Get expenses for a specific month
    getExpensesByMonth(year, month) {
        const expenses = Storage.getExpenses();
        return expenses.filter(e => {
            const date = new Date(e.date);
            return date.getFullYear() === year && date.getMonth() === month;
        });
    },

    /**
     * Core calculation function - calculates daily and monthly metrics
     * @param {Array} earnings - Array of earning entries sorted by date
     * @param {Object} config - Config with fuelConsumptionRate, fuelPricePerLiter, maintenanceCostPerKm
     * @returns {Object} Detailed metrics including daily breakdown and totals
     */
    calculateMetrics(earnings, config, expenses = []) {
        const passes = Storage.getPasses();
        const passTypes = passes.passTypes || {};
        const passActivations = Array.isArray(passes.activations) ? passes.activations : [];
        const fuelConsumptionRate = parseFloat(config?.fuelConsumptionRate) || 13;  // km/l
        const maintenanceCostPerKm = parseFloat(config?.maintenanceCostPerKm) || 10; // LKR/km

        if (!earnings || earnings.length === 0) {
            const totalManualExpenses = (expenses || []).reduce((sum, expense) => {
                return sum + (parseFloat(expense.amount) || 0);
            }, 0);
            return {
                totalRideIncome: 0,
                totalRideDistance: 0,
                totalFuelCost: 0,
                totalMaintenanceCost: 0,
                allocatedDriverPassCost: 0,
                totalManualExpenses,
                trueNetProfit: -totalManualExpenses,
                profitPerKm: 0,
                profitPerDay: 0,
                activeDrivingDays: 0,
                dailyBreakdown: []
            };
        }

        let dailyBreakdown = [];
        let totalRideIncome = 0;
        let totalRideDistance = 0;
        let totalFuelCost = 0;
        let totalMaintenanceCost = 0;
        let allocatedDriverPassCost = 0; // Uber-only pass cost allocation
        let activeDrivingDays = 0;

        // Sort earnings by date to process chronologically
        const sortedEarnings = [...earnings].sort((a, b) => new Date(a.date) - new Date(b.date));
        const uberDrivingDateSet = new Set(
            sortedEarnings
                .filter((earning) => this.normalizeApp(earning.app) === 'uber')
                .map((earning) => earning.date)
        );

        // Passes are charged only for Uber operation windows that overlap Uber earning days.
        allocatedDriverPassCost = passActivations.reduce((sum, activation) => {
            const passType = passTypes[activation.type];
            if (!passType) return sum;

            const start = new Date(activation.dateTime);
            if (Number.isNaN(start.getTime())) return sum;

            const durationHours = parseFloat(passType.durationHours) || 0;
            const end = new Date(start.getTime() + (durationHours * 60 * 60 * 1000));

            const overlapsUberDay = [...uberDrivingDateSet].some((uberDate) => {
                const dayStart = new Date(`${uberDate}T00:00:00`);
                const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000));
                return start < dayEnd && end > dayStart;
            });

            return overlapsUberDay ? sum + (parseFloat(passType.price) || 0) : sum;
        }, 0);

        // Calculate daily metrics
        sortedEarnings.forEach((earning) => {
            const totalRideDistance_earn = parseFloat(earning.totalRideDistance) || 0;
            const totalIncome = parseFloat(earning.totalIncome) || 0;
            const numberOfTrips = parseInt(earning.numberOfTrips) || 0;

            // Fuel cost based on consumption
            const fuelUsed = totalRideDistance_earn / fuelConsumptionRate;
            const fuelPricePerLiter = this.getFuelPricePerLiterForDate(earning.date, config);
            const dailyFuelCost = fuelUsed * fuelPricePerLiter;

            const dailyMaintenanceCost = totalRideDistance_earn * maintenanceCostPerKm;

            totalRideIncome += totalIncome;
            totalRideDistance += totalRideDistance_earn;
            totalFuelCost += dailyFuelCost;
            totalMaintenanceCost += dailyMaintenanceCost;
            activeDrivingDays++;

            dailyBreakdown.push({
                date: earning.date,
                rideDistance: totalRideDistance_earn,
                income: totalIncome,
                numberOfTrips: numberOfTrips,
                fuelPricePerLiter,
                fuelCost: dailyFuelCost,
                maintenanceCost: dailyMaintenanceCost,
                driverPassCost: 0,
                dailyNetProfit: totalIncome - dailyFuelCost - dailyMaintenanceCost
            });
        });

        const totalManualExpenses = (expenses || []).reduce((sum, expense) => {
            return sum + (parseFloat(expense.amount) || 0);
        }, 0);

        const trueNetProfit = totalRideIncome - totalFuelCost - allocatedDriverPassCost - totalMaintenanceCost - totalManualExpenses;
        const profitPerKm = totalRideDistance > 0 ? trueNetProfit / totalRideDistance : 0;
        const profitPerDay = activeDrivingDays > 0 ? trueNetProfit / activeDrivingDays : 0;

        return {
            totalRideIncome,
            totalRideDistance,
            totalFuelCost,
            totalMaintenanceCost,
            allocatedDriverPassCost,
            totalManualExpenses,
            trueNetProfit,
            profitPerKm,
            profitPerDay,
            activeDrivingDays,
            dailyBreakdown
        };
    },

    /**
     * Get complete monthly summary
     * @param {number} year - Year
     * @param {number} month - Month (0-11)
     * @returns {Object} Monthly summary metrics
     */
    getMonthlySummary(year, month, appFilter = 'all') {
        const earnings = this.getEarningsByMonth(year, month, appFilter);
        const expenses = this.getExpensesByMonth(year, month);
        const config = Storage.getConfig();
        return this.calculateMetrics(earnings, config, expenses);
    },

    /**
     * Get complete summary of all data
     * @returns {Object} Overall summary metrics
     */
    getAllSummary() {
        const earnings = Storage.getEarnings();
        const expenses = Storage.getExpenses();
        const config = Storage.getConfig();
        return this.calculateMetrics(earnings, config, expenses);
    }
};
