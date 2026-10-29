(function () {
  'use strict';

  const DB_NAME = 'azaraan-glyph-studio';
  const DB_VERSION = 1;
  const STORE_NAME = 'projects';
  const PROJECT_KEY = 'active-project';

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB is unavailable.'));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open browser storage.'));
    });
  }

  async function transact(mode, callback) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      const request = callback(store);
      if (request) {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Browser storage request failed.'));
      }
      transaction.oncomplete = () => database.close();
      transaction.onerror = () => reject(transaction.error || new Error('Browser storage transaction failed.'));
      transaction.onabort = () => reject(transaction.error || new Error('Browser storage transaction was cancelled.'));
    });
  }

  const StudioStorage = {
    async load() {
      try {
        return await transact('readonly', store => store.get(PROJECT_KEY));
      } catch (error) {
        try {
          const raw = localStorage.getItem('azaraan-glyph-studio-project');
          return raw ? JSON.parse(raw) : null;
        } catch (_) {
          return null;
        }
      }
    },
    async save(project) {
      const snapshot = JSON.parse(JSON.stringify(project));
      snapshot.updatedAt = new Date().toISOString();
      try {
        await transact('readwrite', store => store.put(snapshot, PROJECT_KEY));
      } catch (error) {
        try {
          localStorage.setItem('azaraan-glyph-studio-project', JSON.stringify(snapshot));
        } catch (_) {
          throw new Error('The browser could not save this draft. Export the project JSON to keep a copy.');
        }
      }
      return snapshot.updatedAt;
    }
  };

  window.StudioStorage = StudioStorage;
}());
