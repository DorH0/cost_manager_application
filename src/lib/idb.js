window.idb = window.idb || {};

window.idb.openCostsDB = function (databaseName, databaseVersion) {
    // Return a Promise that resolves to our custom database wrapper object
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(databaseName, databaseVersion);

        request.onerror = (event) => {
            console.error("Database error:", event.target.error);
            reject(event.target.error);
        };

        request.onsuccess = (event) => {
            const nativeDB = event.target.result;
            console.log(`Database '${databaseName}' (v${databaseVersion}) opened successfully.`);

            const dbWrapper = {
                _nativeDB: nativeDB,

                addCost: function(cost) {
                    return new Promise((resolveAdd, rejectAdd) => {
                        if (!this._nativeDB) {
                            rejectAdd(new Error("Database connection lost in wrapper."));
                            return;
                        }

                        const costWithDate = {
                            ...cost,
                            date: new Date().toISOString(),
                            yearMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` // YYYY-MM
                        };

                        const transaction = this._nativeDB.transaction(['costs'], 'readwrite');
                        const store = transaction.objectStore('costs');

                        const addRequest = store.add(costWithDate);

                        addRequest.onsuccess = (addEvent) => {
                            console.log("Cost added successfully with key:", addEvent.target.result);
                            resolveAdd({...costWithDate, id: addEvent.target.result});
                        };

                        addRequest.onerror = (addError) => {
                            console.error("Error adding cost:", addError.target.error);
                            rejectAdd(addError.target.error);
                        };
                    });
                },

                getReport: function(year, month, targetCurrency /*, rates */) {

                    console.warn("getReport is a placeholder. Full implementation needed.");
                    return Promise.resolve({
                        year: year,
                        month: month,
                        costs: [],
                        total: { currency: targetCurrency, total: 0 }
                    });
                }
            };
            // Resolve the openCostsDB promise with the wrapper object
            resolve(dbWrapper);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('costs')) {
                const store = db.createObjectStore('costs', { keyPath: 'id', autoIncrement: true });
                store.createIndex('date', 'date', { unique: false });
                store.createIndex('category', 'category', { unique: false });
                store.createIndex('yearMonth', 'yearMonth', { unique: false });
                console.log("Object store 'costs' created");
            } else {
                console.log("Object store 'costs' already exists.");
            }
        };
    });
};

console.log("idb.js library loaded. Use idb.openCostsDB() to get a database wrapper object.");