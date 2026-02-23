/**
 * Calculations Module
 * Handles all profit/loss calculations
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

    // Get mileage for a specific month
    getMileageByMonth(year, month) {
        const mileage = Storage.getMileage();
        return mileage.filter(m => {
            const date = new Date(m.date);
            return date.getFullYear() === year && date.getMonth() === month;
        });
    },

    // Calculate total revenue for earnings list
    calculateTotalRevenue(earnings) {
        return earnings.reduce((sum, e) => {
            const net = e.grossFare - e.commission + (e.tips || 0);
            return sum + net;
        }, 0);
    },

    // Calculate total expenses by type
    calculateTotalExpenses(expenses) {
        return expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    },

    // Group expenses by category
    groupExpensesByCategory(expenses) {
        return expenses.reduce((groups, expense) => {
            const category = expense.category;
            if (!groups[category]) {
                groups[category] = 0;
            }
            groups[category] += parseFloat(expense.amount);
            return groups;
        }, {});
    },

    // Group expenses by type
    groupExpensesByType(expenses) {
        return expenses.reduce((groups, expense) => {
            const type = expense.type;
            if (!groups[type]) {
                groups[type] = 0;
            }
            groups[type] += parseFloat(expense.amount);
            return groups;
        }, {});
    },

    // Calculate total kilometers for a month
    calculateTotalKilometers(mileage) {
        return mileage.reduce((sum, m) => {
            const distance = parseFloat(m.odometerEnd) - parseFloat(m.odometerStart);
            return sum + distance;
        }, 0);
    },

    // Calculate cost per km
    calculateCostPerKm(totalExpenses, totalKm) {
        if (totalKm === 0) return 0;
        return totalExpenses / totalKm;
    },

    // Calculate profit per km
    calculateProfitPerKm(netProfit, totalKm) {
        if (totalKm === 0) return 0;
        return netProfit / totalKm;
    },

    // Calculate hourly profit
    calculateHourlyProfit(netProfit, totalHours) {
        if (totalHours === 0) return 0;
        return netProfit / totalHours;
    },

    // Calculate total hours
    calculateTotalHours(earnings) {
        return earnings.reduce((sum, e) => sum + parseFloat(e.onlineHours || 0), 0);
    },

    // Calculate profit margin %
    calculateProfitMargin(netProfit, totalRevenue) {
        if (totalRevenue === 0) return 0;
        return (netProfit / totalRevenue) * 100;
    },

    // Get complete monthly summary
    getMonthlySummary(year, month) {
        const earnings = this.getEarningsByMonth(year, month);
        const expenses = this.getExpensesByMonth(year, month);
        const mileage = this.getMileageByMonth(year, month);

        const totalRevenue = this.calculateTotalRevenue(earnings);
        const totalExpenses = this.calculateTotalExpenses(expenses);
        const netProfit = totalRevenue - totalExpenses;
        const totalKm = this.calculateTotalKilometers(mileage);
        const totalHours = this.calculateTotalHours(earnings);
        const costPerKm = this.calculateCostPerKm(totalExpenses, totalKm);
        const profitPerKm = this.calculateProfitPerKm(netProfit, totalKm);
        const hourlyProfit = this.calculateHourlyProfit(netProfit, totalHours);
        const profitMargin = this.calculateProfitMargin(netProfit, totalRevenue);

        return {
            totalRevenue,
            totalExpenses,
            netProfit,
            totalKm,
            totalHours,
            costPerKm,
            profitPerKm,
            hourlyProfit,
            profitMargin,
            expensesByCategory: this.groupExpensesByCategory(expenses),
            expensesByType: this.groupExpensesByType(expenses)
        };
    }
};
