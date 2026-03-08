/**
 * Export Module
 * Handles CSV export for different data types
 */

const Exporter = {
    getAppLabel(app) {
        const labels = {
            all: 'All Apps',
            uber: 'Uber',
            pickme: 'PickMe',
            'hela-go': 'Hela Go'
        };
        return labels[String(app || '').toLowerCase()] || app;
    },

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

    // Download JSON file helper
    downloadJSON(jsonContent, filename) {
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
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
        const headers = ['Date', 'App', 'Ride Distance (km)', 'Total Income', 'Number of Trips'];
        const data = earnings.map(e => ({
            'Date': e.date,
            'App': e.app || 'uber',
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
    exportSummary(year, month, appFilter = 'all') {
        const summary = Calculations.getMonthlySummary(year, month, appFilter);
        const monthYear = new Date(year, month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        const appLabel = this.getAppLabel(appFilter);

        let csvContent = `Ride App Profit & Loss Statement\n`;
        csvContent += `Month: ${monthYear}\n\n`;
        csvContent += `App Filter,${appLabel}\n\n`;
        csvContent += `Total Ride Income,${summary.totalRideIncome.toFixed(2)}\n`;
        csvContent += `Total Ride Distance,${summary.totalRideDistance.toFixed(1)} km\n`;
        csvContent += `Fuel Cost,${summary.totalFuelCost.toFixed(2)}\n`;
        csvContent += `Maintenance Cost,${summary.totalMaintenanceCost.toFixed(2)}\n`;
        csvContent += `Uber Pass Cost,${summary.allocatedDriverPassCost.toFixed(2)}\n\n`;
        csvContent += `Recorded Expenses,${summary.totalManualExpenses.toFixed(2)}\n\n`;
        csvContent += `True Net Profit,${summary.trueNetProfit.toFixed(2)}\n`;
        csvContent += `Profit per KM,${summary.profitPerKm.toFixed(2)}\n`;
        csvContent += `Profit per Day,${summary.profitPerDay.toFixed(2)}\n`;
        csvContent += `Active Driving Days,${summary.activeDrivingDays}\n`;

        this.downloadCSV(csvContent, `Summary_${monthYear}.csv`);
    },

    // Export full local backup as JSON
    exportAllData() {
        const backup = {
            exportedAt: new Date().toISOString(),
            app: 'laabe',
            version: 1,
            data: {
                earnings: Storage.getEarnings(),
                expenses: Storage.getExpenses(),
                mileage: Storage.getMileage(),
                passes: Storage.getPasses(),
                config: Storage.getConfig()
            }
        };

        const json = JSON.stringify(backup, null, 2);
        const date = new Date().toISOString().split('T')[0];
        this.downloadJSON(json, `LAABE_Backup_${date}.json`);
    },

    // Parse CSV string to array
    parseCSV(csvContent) {
        const lines = csvContent.trim().split('\n');
        if (lines.length < 2) return { headers: [], data: [] };

        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = [];
            let current = '';
            let insideQuotes = false;

            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') {
                    insideQuotes = !insideQuotes;
                } else if (char === ',' && !insideQuotes) {
                    values.push(current.trim().replace(/^"(.*)"$/, '$1'));
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim().replace(/^"(.*)"$/, '$1'));

            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });
            data.push(obj);
        }

        return { headers, data };
    },

    // Import earnings from CSV
    importEarnings(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const { headers, data } = this.parseCSV(content);

                if (!headers.includes('Date') || !headers.includes('Ride Distance (km)') || !headers.includes('Total Income')) {
                    alert('Invalid earnings file format. Expected columns: Date, Ride Distance (km), Total Income, Number of Trips');
                    return;
                }

                let imported = 0;
                data.forEach(row => {
                    try {
                        const earning = {
                            date: row['Date'],
                            app: row['App'] || 'uber',
                            totalRideDistance: parseFloat(row['Ride Distance (km)']) || 0,
                            totalIncome: parseFloat(row['Total Income']) || 0,
                            numberOfTrips: parseInt(row['Number of Trips']) || 0
                        };

                        if (earning.date && (earning.totalRideDistance > 0 || earning.totalIncome > 0)) {
                            Storage.addEarning(earning);
                            imported++;
                        }
                    } catch (err) {
                        console.error('Error importing row:', row, err);
                    }
                });

                if (imported > 0) {
                    UI.renderEarningsTable();
                    UI.updateSummary();
                    alert(`Successfully imported ${imported} earning(s)!`);
                } else {
                    alert('No valid earnings found in file.');
                }
            } catch (error) {
                console.error('Import error:', error);
                alert('Error importing file: ' + error.message);
            }
        };
        reader.onerror = () => {
            alert('Error reading file');
        };
        reader.readAsText(file);
    },

    // Import expenses from CSV
    importExpenses(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const { headers, data } = this.parseCSV(content);

                if (!headers.includes('Date') || !headers.includes('Category') || !headers.includes('Amount')) {
                    alert('Invalid expenses file format. Expected columns: Date, Category, Amount, Type, Notes, Odometer');
                    return;
                }

                let imported = 0;
                data.forEach(row => {
                    try {
                        const expense = {
                            date: row['Date'],
                            category: row['Category'],
                            amount: parseFloat(row['Amount']) || 0,
                            type: row['Type'] || 'variable',
                            notes: row['Notes'] || '',
                            odometer: row['Odometer'] ? parseFloat(row['Odometer']) : null
                        };

                        if (expense.date && expense.amount > 0) {
                            Storage.addExpense(expense);
                            imported++;
                        }
                    } catch (err) {
                        console.error('Error importing row:', row, err);
                    }
                });

                if (imported > 0) {
                    UI.renderExpenseTable();
                    UI.updateSummary();
                    alert(`Successfully imported ${imported} expense(s)!`);
                } else {
                    alert('No valid expenses found in file.');
                }
            } catch (error) {
                console.error('Import error:', error);
                alert('Error importing file: ' + error.message);
            }
        };
        reader.onerror = () => {
            alert('Error reading file');
        };
        reader.readAsText(file);
    },

    // Import full local backup from JSON (replaces existing local data)
    importAllData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const parsed = JSON.parse(content);
                const payload = parsed && parsed.data ? parsed.data : parsed;

                if (!payload || typeof payload !== 'object') {
                    alert('Invalid backup format.');
                    return;
                }

                const earnings = Array.isArray(payload.earnings) ? payload.earnings : null;
                const expenses = Array.isArray(payload.expenses) ? payload.expenses : null;
                const mileage = Array.isArray(payload.mileage) ? payload.mileage : null;
                const passes = payload.passes && typeof payload.passes === 'object' ? payload.passes : null;
                const config = payload.config && typeof payload.config === 'object' ? payload.config : null;

                if (!earnings || !expenses || !mileage || !passes || !config) {
                    alert('Backup is missing required data sections.');
                    return;
                }

                const confirmReplace = confirm('Importing full backup will replace current local data. Continue?');
                if (!confirmReplace) return;

                Storage.set(Storage.keys.earnings, earnings);
                Storage.set(Storage.keys.expenses, expenses);
                Storage.set(Storage.keys.mileage, mileage);
                Storage.set(Storage.keys.passes, passes);
                Storage.set(Storage.keys.config, config);

                // Normalize/migrate imported data shape
                Storage.initDefaults();

                UI.renderAllData();
                alert('Full backup imported successfully!');
            } catch (error) {
                console.error('Full backup import error:', error);
                alert('Error importing backup: ' + error.message);
            }
        };
        reader.onerror = () => {
            alert('Error reading backup file');
        };
        reader.readAsText(file);
    }
};

