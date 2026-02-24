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
        const headers = ['Date', 'Ride Distance (km)', 'Total Income', 'Number of Trips'];
        const data = earnings.map(e => ({
            'Date': e.date,
            'Ride Distance (km)': e.totalRideDistance.toFixed(1),
            'Total Income': e.totalIncome.toFixed(2),
            'Number of Trips': e.numberOfTrips
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
        csvContent += `Total Ride Income,${summary.totalRideIncome.toFixed(2)}\n`;
        csvContent += `Total Ride Distance,${summary.totalRideDistance.toFixed(1)} km\n`;
        csvContent += `Total Extra Distance,${summary.totalExtraDistance.toFixed(1)} km\n`;
        csvContent += `Fuel Cost,${summary.totalFuelCost.toFixed(2)}\n`;
        csvContent += `Maintenance Cost,${summary.totalMaintenanceCost.toFixed(2)}\n`;
        csvContent += `Driver Pass Cost,${summary.allocatedDriverPassCost.toFixed(2)}\n\n`;
        csvContent += `True Net Profit,${summary.trueNetProfit.toFixed(2)}\n`;
        csvContent += `Profit per KM,${summary.profitPerKm.toFixed(2)}\n`;
        csvContent += `Profit per Day,${summary.profitPerDay.toFixed(2)}\n`;
        csvContent += `Active Driving Days,${summary.activeDrivingDays}\n`;

        this.downloadCSV(csvContent, `Summary_${monthYear}.csv`);
    }
};
