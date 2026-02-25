/**
 * Calculations Module
 * Handles all profit/loss calculations for Uber driving
 */

const Calculations = {
    // Get earnings for a specific month
    getEarningsByMonth(year, month) {
        const earnings = Storage.getEarnings();
        return earnings.filter(e => {
            const date = new Date(e.date);
            return date.getFullYear() === year && date.getMonth() === month;
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
     * @param {Object} config - Config with driverPassCostPerDay, driverPassActivationDate, fuelConsumptionRate, fuelPricePerLiter, maintenanceCostPerKm
     * @returns {Object} Detailed metrics including daily breakdown and totals
     */
    calculateMetrics(earnings, config, expenses = []) {
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

        const driverPassCostPerDay = config.driverPassCostPerDay || 999;
        const driverPassActivationDate = config.driverPassActivationDate || new Date().toISOString().split('T')[0];
        const fuelConsumptionRate = config.fuelConsumptionRate || 13;  // km/l
        const fuelPricePerLiter = config.fuelPricePerLiter || 250;     // LKR/l
        const maintenanceCostPerKm = config.maintenanceCostPerKm || 10; // LKR/km

        let dailyBreakdown = [];
        let totalRideIncome = 0;
        let totalRideDistance = 0;
        let totalFuelCost = 0;
        let totalMaintenanceCost = 0;
        let allocatedDriverPassCost = 0;
        let activeDrivingDays = 0;

        // Sort earnings by date to process chronologically
        const sortedEarnings = [...earnings].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate daily metrics
        sortedEarnings.forEach((earning) => {
            const totalRideDistance_earn = parseFloat(earning.totalRideDistance) || 0;
            const totalIncome = parseFloat(earning.totalIncome) || 0;
            const numberOfTrips = parseInt(earning.numberOfTrips) || 0;

            // Fuel cost based on consumption
            const fuelUsed = totalRideDistance_earn / fuelConsumptionRate;
            const dailyFuelCost = fuelUsed * fuelPricePerLiter;

            // Driver pass cost - only if date >= activation date
            let driverPassCost = 0;
            if (earning.date >= driverPassActivationDate) {
                driverPassCost = driverPassCostPerDay;
                allocatedDriverPassCost += driverPassCostPerDay;
            }

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
                fuelCost: dailyFuelCost,
                maintenanceCost: dailyMaintenanceCost,
                driverPassCost: driverPassCost,
                dailyNetProfit: totalIncome - dailyFuelCost - dailyMaintenanceCost - driverPassCost
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
    getMonthlySummary(year, month) {
        const earnings = this.getEarningsByMonth(year, month);
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
