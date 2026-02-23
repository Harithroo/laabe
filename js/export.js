/**
 * Export Module
 * Handles CSV export for different data types
 */

const Exporter = {
    // Convert array of objects to CSV
    convertToCSV(data, headers) {
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Escape quotes and wrap in quotes if contains comma
                    if (typeof value === 'string' && value.includes(',')) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value || '';
                }).join(',')
            )
        ].join('\n');

        return csvContent;
    },

    // Download file helper
    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // Export earnings to CSV
    exportEarnings() {
        const earnings = Storage.getEarnings();
        const headers = ['Date', 'Gross Fare', 'Commission', 'Tips', 'Net Earned', 'Trip Count', 'Online Hours'];
        const data = earnings.map(e => ({
            'Date': e.date,
            'Gross Fare': e.grossFare.toFixed(2),
            'Commission': e.commission.toFixed(2),
            'Tips': (e.tips || 0).toFixed(2),
            'Net Earned': (e.grossFare - e.commission + (e.tips || 0)).toFixed(2),
            'Trip Count': e.tripCount,
            'Online Hours': e.onlineHours
        }));

        const csv = this.convertToCSV(data, headers);
        this.downloadCSV(csv, `Earnings_${new Date().toISOString().split('T')[0]}.csv`);
    },

    // Export expenses to CSV
    exportExpenses() {
        const expenses = Storage.getExpenses();
        const headers = ['Date', 'Category', 'Amount', 'Type', 'Notes', 'Odometer'];
        const data = expenses.map(e => ({
            'Date': e.date,
            'Category': e.category,
            'Amount': e.amount.toFixed(2),
            'Type': e.type,
            'Notes': e.notes || '',
            'Odometer': e.odometer || ''
        }));

        const csv = this.convertToCSV(data, headers);
        this.downloadCSV(csv, `Expenses_${new Date().toISOString().split('T')[0]}.csv`);
    },

    // Export monthly summary to CSV
    exportSummary(year, month) {
        const summary = Calculations.getMonthlySummary(year, month);
        const monthYear = new Date(year, month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

        let csvContent = `Uber Driver Profit & Loss Statement\n`;
        csvContent += `Month: ${monthYear}\n\n`;
        csvContent += `Total Revenue,${summary.totalRevenue.toFixed(2)}\n`;
        csvContent += `Total Expenses,${summary.totalExpenses.toFixed(2)}\n`;
        csvContent += `Net Profit,${summary.netProfit.toFixed(2)}\n`;
        csvContent += `Profit Margin,${summary.profitMargin.toFixed(2)}%\n\n`;
        csvContent += `Total KM,${summary.totalKm.toFixed(2)}\n`;
        csvContent += `Cost per KM,${summary.costPerKm.toFixed(2)}\n`;
        csvContent += `Profit per KM,${summary.profitPerKm.toFixed(2)}\n`;
        csvContent += `Total Hours,${summary.totalHours.toFixed(2)}\n`;
        csvContent += `Hourly Profit,${summary.hourlyProfit.toFixed(2)}\n\n`;
        csvContent += `Expense Summary\n`;
        csvContent += `Category,Amount\n`;

        for (const [category, amount] of Object.entries(summary.expensesByCategory)) {
            csvContent += `${category},${amount.toFixed(2)}\n`;
        }

        this.downloadCSV(csvContent, `Summary_${monthYear}.csv`);
    }
};
