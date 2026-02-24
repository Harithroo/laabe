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
     * @param {Array} earnings - Array of earning entries
     * @param {Object} config - Config with baseCommuteDistance, driverPassCost, fuelCostPerKm, maintenanceCostPerKm
     * @returns {Object} Detailed metrics including daily breakdown and totals
     */
    calculateMetrics(earnings, config) {
        if (!earnings || earnings.length === 0) {
            return {
                totalRideIncome: 0,
                totalRideDistance: 0,
                totalExtraDistance: 0,
                totalFuelCost: 0,
                totalMaintenanceCost: 0,
                allocatedDriverPassCost: 0,
                trueNetProfit: 0,
                profitPerKm: 0,
                profitPerDay: 0,
                activeDrivingDays: 0,
                dailyBreakdown: []
            };
        }

        const baseCommuteDistance = config.baseCommuteDistance || 16;
        const driverPassCost = config.driverPassCost || 999;
        const fuelCostPerKm = config.fuelCostPerKm || 0;
        const maintenanceCostPerKm = config.maintenanceCostPerKm || 0;

        let dailyBreakdown = [];
        let totalRideIncome = 0;
        let totalRideDistance = 0;
        let totalExtraDistance = 0;
        let totalFuelCost = 0;
        let totalMaintenanceCost = 0;
        let totalDailyProfit = 0;

        // Calculate daily metrics
        earnings.forEach(earning => {
            const totalRideDistance_earn = parseFloat(earning.totalRideDistance) || 0;
            const totalIncome = parseFloat(earning.totalIncome) || 0;
            const numberOfTrips = parseInt(earning.numberOfTrips) || 0;

            const extraDistance = Math.max(0, totalRideDistance_earn - baseCommuteDistance);
            const dailyFuelCost = extraDistance * fuelCostPerKm;
            const dailyMaintenanceCost = totalRideDistance_earn * maintenanceCostPerKm;

            totalRideIncome += totalIncome;
            totalRideDistance += totalRideDistance_earn;
            totalExtraDistance += extraDistance;
            totalFuelCost += dailyFuelCost;
            totalMaintenanceCost += dailyMaintenanceCost;

            dailyBreakdown.push({
                date: earning.date,
                rideDistance: totalRideDistance_earn,
                extraDistance: extraDistance,
                income: totalIncome,
                numberOfTrips: numberOfTrips,
                fuelCost: dailyFuelCost,
                maintenanceCost: dailyMaintenanceCost,
                driverPassAllocation: 0  // Will be calculated below
            });
        });

        const activeDrivingDays = earnings.length;
        const dailyDriverPassCost = driverPassCost / activeDrivingDays;
        const allocatedDriverPassCost = dailyDriverPassCost * activeDrivingDays;

        // Add daily driver pass allocation to breakdown
        dailyBreakdown.forEach(day => {
            day.driverPassAllocation = dailyDriverPassCost;
            day.dailyNetProfit = day.income - day.fuelCost - day.maintenanceCost - dailyDriverPassCost;
            totalDailyProfit += day.dailyNetProfit;
        });

        const trueNetProfit = totalRideIncome - totalFuelCost - allocatedDriverPassCost - totalMaintenanceCost;
        const profitPerKm = totalRideDistance > 0 ? trueNetProfit / totalRideDistance : 0;
        const profitPerDay = activeDrivingDays > 0 ? trueNetProfit / activeDrivingDays : 0;

        return {
            totalRideIncome,
            totalRideDistance,
            totalExtraDistance,
            totalFuelCost,
            totalMaintenanceCost,
            allocatedDriverPassCost,
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
        const config = Storage.getConfig();
        return this.calculateMetrics(earnings, config);
    },

    /**
     * Get complete summary of all data
     * @returns {Object} Overall summary metrics
     */
    getAllSummary() {
        const earnings = Storage.getEarnings();
        const config = Storage.getConfig();
        return this.calculateMetrics(earnings, config);
    }
};
