(function (global) {
  'use strict';
  const LF = global.LiteraryFriend;
  const U = LF.util;

  class LocalStore {
    constructor(name = LF.backend.localStoreName) {
      this.name = name;
      this.version = 2;
      this.db = null;
      this.memory = new Map();
    }

    async open() {
      if (!('indexedDB' in global)) return null;
      if (this.db) return this.db;
      this.db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(this.name, this.version);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = () => {
          const db = request.result;
          const stores = [
            ['kv', { keyPath: 'key' }],
            ['drafts', { keyPath: 'id' }],
            ['queue', { keyPath: 'id' }],
            ['files', { keyPath: 'id' }],
            ['recent', { keyPath: 'id' }],
            ['snapshots', { keyPath: 'id' }]
          ];
          for (const [name, options] of stores) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, options);
        };
        request.onsuccess = () => resolve(request.result);
      });
      return this.db;
    }

    async _store(name, mode = 'readonly') {
      const db = await this.open();
      if (!db) return null;
      return db.transaction(name, mode).objectStore(name);
    }

    async put(storeName, value) {
      if (!value || value.id == null && value.key == null) throw new Error(`A key is required for ${storeName}.`);
      const store = await this._store(storeName, 'readwrite');
      if (!store) { this.memory.set(`${storeName}:${value.id ?? value.key}`, U.deepClone(value)); return value; }
      return new Promise((resolve, reject) => {
        const req = store.put(U.deepClone(value));
        req.onsuccess = () => resolve(value); req.onerror = () => reject(req.error);
      });
    }

    async get(storeName, key) {
      const store = await this._store(storeName);
      if (!store) return U.deepClone(this.memory.get(`${storeName}:${key}`));
      return new Promise((resolve, reject) => {
        const req = store.get(key); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error);
      });
    }

    async list(storeName) {
      const store = await this._store(storeName);
      if (!store) return Array.from(this.memory.entries()).filter(([k]) => k.startsWith(`${storeName}:`)).map(([,v]) => U.deepClone(v));
      return new Promise((resolve, reject) => {
        const req = store.getAll(); req.onsuccess = () => resolve(req.result || []); req.onerror = () => reject(req.error);
      });
    }

    async delete(storeName, key) {
      const store = await this._store(storeName, 'readwrite');
      if (!store) return this.memory.delete(`${storeName}:${key}`);
      return new Promise((resolve, reject) => {
        const req = store.delete(key); req.onsuccess = () => resolve(true); req.onerror = () => reject(req.error);
      });
    }

    async set(key, value) { return this.put('kv', { key, value, updatedAt: U.now() }); }
    async value(key, fallback = null) { return (await this.get('kv', key))?.value ?? fallback; }

    async saveDraft(projectId, nodeId, payload) {
      const id = `${projectId || 'none'}:${nodeId || 'untitled'}`;
      return this.put('drafts', { id, projectId, nodeId, payload, updatedAt: U.now() });
    }

    async getDraft(projectId, nodeId) { return this.get('drafts', `${projectId || 'none'}:${nodeId || 'untitled'}`); }

    async enqueue(action, data, meta = {}) {
      const item = { id: U.uid('queue'), action, data, meta, attempts: 0, status: 'pending', createdAt: U.now(), updatedAt: U.now() };
      await this.put('queue', item);
      LF.events.emit('queue:changed', item);
      return item;
    }

    async flushQueue(api = LF.services.api) {
      if (!navigator.onLine || !api.hasToken()) return { sent: 0, failed: 0 };
      const pending = (await this.list('queue')).filter(item => item.status === 'pending' || item.status === 'retry');
      let sent = 0, failed = 0;
      for (const item of pending) {
        try {
          await api.request(item.action, item.data);
          await this.delete('queue', item.id);
          sent++;
        } catch (error) {
          item.attempts = Number(item.attempts || 0) + 1;
          item.updatedAt = U.now();
          item.status = item.attempts >= 5 ? 'failed' : 'retry';
          item.lastError = { code: error.code, message: error.message };
          await this.put('queue', item);
          failed++;
        }
      }
      LF.events.emit('queue:flushed', { sent, failed });
      return { sent, failed };
    }
  }

  LF.services.store = new LocalStore();
  global.addEventListener('online', () => LF.services.store.flushQueue().catch(console.error));
})(window);
