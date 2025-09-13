/**
 * Opens the IndexedDB database and returns a wrapper object with methods.
 * @param {string} databaseName - The name of the database.
 * @param {number} databaseVersion - The version of the database.
 * @returns {Promise<Object>} A promise that resolves to a database wrapper object.
 */
export async function openCostsDB(databaseName, databaseVersion) {
    // Return a Promise that resolves to our custom database wrapper object
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, databaseVersion);

        request.onerror = (event) => {
            console.error("ES Module: Database error:", event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            // Get the native IDBDatabase object
            const nativeDB = event.target.result;
            console.log(`ES Module: Database '${databaseName}' (v${databaseVersion}) opened successfully.`);

            const dbWrapper = {
                // Store a reference to the native DB for internal use by methods
                _nativeDB: nativeDB,

                /**
                 * Adds a new cost item to the database.
                 * @param {Object} cost - The cost object {sum, currency, category, description}.
                 * @returns {Promise<Object>} A promise that resolves to the added cost item.
                 */
                addCost: function(cost) {
                    return new Promise((resolveAdd, rejectAdd) => {
                        if (!this._nativeDB) {
                            rejectAdd(new Error("ES Module: Database connection lost in wrapper."));
                            return;
                        }

                        const costWithDate = {
                            ...cost,
                            date: new Date().toISOString(),
                            yearMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
                        };

                        const transaction = this._nativeDB.transaction(['costs'], 'readwrite');
                        const store = transaction.objectStore('costs');

                        const addRequest = store.add(costWithDate);

                        addRequest.onsuccess = (addEvent) => {
                            console.log("ES Module: Cost added successfully with key:", addEvent.target.result);
                            resolveAdd({...costWithDate, id: addEvent.target.result});
                        };

                        addRequest.onerror = (addError) => {
                            console.error("ES Module: Error adding cost:", addError.target.error);
                            rejectAdd(addError.target.error);
                        };
                    });
                },

                /**
                 * Fetches costs for a specific year and month using the 'yearMonth' index.
                 * Used by PieChartView.
                 * @param {number} year - The year.
                 * @param {number} month - The month (1-12).
                 * @returns {Promise<Array>} A promise that resolves to an array of cost objects.
                 */
                getCostsForMonth: function(year, month) {
                    return new Promise((resolve, reject) => {
                        if (!this._nativeDB) {
                            reject(new Error("ES Module: Database connection lost in wrapper (getCostsForMonth)."));
                            return;
                        }

                        try {
                            const transaction = this._nativeDB.transaction(['costs'], 'readonly');
                            const store = transaction.objectStore('costs');
                            const index = store.index('yearMonth');

                            const yearMonthKey = `${year}-${String(month).padStart(2, '0')}`;
                            const getRequest = index.getAll(IDBKeyRange.only(yearMonthKey));

                            getRequest.onsuccess = () => {
                                console.log(`ES Module: Fetched ${getRequest.result.length} costs for ${year}-${String(month).padStart(2, '0')}`);
                                resolve(getRequest.result);
                            };

                            getRequest.onerror = (getError) => {
                                console.error("ES Module: Error fetching costs for month:", getError.target.error);
                                reject(new Error(`Failed to fetch costs for ${year}-${month}: ${getError.target.error.message}`));
                            };
                        } catch (e) {
                            console.error("ES Module: Exception in getCostsForMonth:", e);
                            reject(e);
                        }
                    });
                },

                /**
                 * Fetches all costs for a specific year using the 'date' index.
                 * Used by BarChartView.
                 * @param {number} year - The year.
                 * @returns {Promise<Array>} A promise that resolves to an array of cost objects.
                 */
                getCostsForYear: function(year) {
                    return new Promise((resolve, reject) => {
                        if (!this._nativeDB) {
                            reject(new Error("ES Module: Database connection lost in wrapper (getCostsForYear)."));
                            return;
                        }

                        try {
                            const transaction = this._nativeDB.transaction(['costs'], 'readonly');
                            const store = transaction.objectStore('costs');
                            const index = store.index('date');

                            const startDate = new Date(Date.UTC(year, 0, 1)).toISOString();
                            const endDate = new Date(Date.UTC(year + 1, 0, 1)).toISOString();
                            const range = IDBKeyRange.bound(startDate, endDate, false, true);

                            const getRequest = index.getAll(range);

                            getRequest.onsuccess = () => {
                                console.log(`ES Module: Fetched ${getRequest.result.length} costs for year ${year}`);
                                resolve(getRequest.result);
                            };

                            getRequest.onerror = (getError) => {
                                console.error("ES Module: Error fetching costs for year:", getError.target.error);
                                reject(new Error(`Failed to fetch costs for year ${year}: ${getError.target.error.message}`));
                            };
                        } catch (e) {
                            console.error("ES Module: Exception in getCostsForYear:", e);
                            reject(e);
                        }
                    });
                },

                /**
                 * Gets a detailed report for a specific month/year in a specific currency.
                 * @param {number} year - The year.
                 * @param {number} month - The month (1-12).
                 * @param {string} targetCurrency - The target currency code (e.g., 'USD').
                 * @param {Object} rates - The currency exchange rates object.
                 * @returns {Promise<Object>} A promise that resolves to the report object.
                 */
                getReport: function(year, month, targetCurrency, rates) {
                    return new Promise(async (resolve, reject) => { // Use async/await inside Promise for clarity
                        if (!this._nativeDB) {
                            reject(new Error("ES Module: Database connection lost in wrapper (getReport)."));
                            return;
                        }

                        if (!rates || typeof rates !== 'object') {
                            reject(new Error("ES Module: Invalid or missing currency rates object for getReport."));
                            return;
                        }

                        try {
                            const rawCosts = await this.getCostsForMonth(year, month);
                            console.log(`ES Module: getReport fetched ${rawCosts.length} raw costs for ${year}-${String(month).padStart(2, '0')}`);

                            let totalInTargetCurrency = 0;
                            const processedCosts = rawCosts.map(rawCost => {
                                const rateFrom = rates[rawCost.currency] ?? 1;
                                const rateTo = rates[targetCurrency] ?? 1;

                                const convertedSum = (rawCost.sum / rateFrom) * rateTo;
                                totalInTargetCurrency += convertedSum;

                                const costDate = new Date(rawCost.date);

                                return {
                                    sum: parseFloat(convertedSum.toFixed(2)),
                                    currency: targetCurrency,
                                    category: rawCost.category,
                                    description: rawCost.description,
                                    Date: {
                                        day: costDate.getUTCDate(),
                                        month: costDate.getUTCMonth() + 1,
                                        year: costDate.getUTCFullYear()
                                    }
                                };
                            });

                            const report = {
                                year: year,
                                month: month,
                                costs: processedCosts,
                                total: {
                                    currency: targetCurrency,
                                    total: parseFloat(totalInTargetCurrency.toFixed(2))
                                }
                            };

                            console.log(`ES Module: getReport generated report for ${year}-${String(month).padStart(2, '0')} in ${targetCurrency}`);
                            resolve(report);

                        } catch (error) {
                            console.error("ES Module: Error generating report in getReport:", error);
                            reject(new Error(`Failed to generate report for ${year}-${month} in ${targetCurrency}: ${error.message}`));
                        }
                    });
                },
            };

            resolve(dbWrapper);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('costs')) {
                const store = db.createObjectStore('costs', { keyPath: 'id', autoIncrement: true });
                store.createIndex('date', 'date', { unique: false });
                store.createIndex('category', 'category', { unique: false });
                store.createIndex('yearMonth', 'yearMonth', { unique: false });
                console.log("ES Module: Object store 'costs' created with indexes.");
            } else {
                console.log("ES Module: Object store 'costs' already exists.");
            }
        };
    });
}

console.log("ES Module idb.mjs loaded.");