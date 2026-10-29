/* All library data is private to the current browser. No network calls. */
window.LuxuryStore = (() => {
  const DATABASE = 'luxury-editor-v1';
  let dbPromise;
  const supported = !!window.indexedDB;
  function open() {
    if (!supported) return Promise.resolve(null);
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(resolve => {
      let request;
      try { request = indexedDB.open(DATABASE, 2); } catch (error) { resolve(null); return; }
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
        if (!db.objectStoreNames.contains('fonts')) db.createObjectStore('fonts', { keyPath:'id' });
        if (!db.objectStoreNames.contains('uploads')) db.createObjectStore('uploads', { keyPath:'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
    return dbPromise;
  }
  async function readState() {
    const db = await open();
    if (!db) { try { return JSON.parse(localStorage.getItem(DATABASE + ':state')); } catch { return null; } }
    return new Promise(resolve => {
      const req = db.transaction('settings','readonly').objectStore('settings').get('state');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  }
  async function writeState(value) {
    const db = await open();
    if (!db) { localStorage.setItem(DATABASE + ':state', JSON.stringify(value)); return; }
    return new Promise((resolve,reject) => {
      const tx = db.transaction('settings','readwrite');
      tx.objectStore('settings').put(value,'state');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Could not save workspace'));
      tx.onabort = () => reject(tx.error || new Error('Save aborted'));
    });
  }
  async function allFonts() {
    const db = await open();
    if (!db) return [];
    return new Promise(resolve => {
      const req = db.transaction('fonts','readonly').objectStore('fonts').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }
  async function putFont(font) {
    const db = await open();
    if (!db) throw new Error('Font persistence requires IndexedDB.');
    return new Promise((resolve,reject) => {
      const tx=db.transaction('fonts','readwrite');tx.objectStore('fonts').put(font);
      tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
    });
  }
  async function removeFont(id) {
    const db=await open();if (!db) return;
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('fonts','readwrite');tx.objectStore('fonts').delete(id);
      tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
    });
  }
  async function saveUpload(id,blob) {
    const db=await open();if(!db)throw new Error('File storage requires IndexedDB.');
    return new Promise((resolve,reject)=>{const tx=db.transaction('uploads','readwrite');tx.objectStore('uploads').put({id,blob});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
  }
  async function getUpload(id) {const db=await open();if(!db)return null;return new Promise(resolve=>{const req=db.transaction('uploads','readonly').objectStore('uploads').get(id);req.onsuccess=()=>resolve(req.result?.blob||null);req.onerror=()=>resolve(null)});}
  async function deleteUpload(id) {const db=await open();if(!db)return;return new Promise((resolve,reject)=>{const tx=db.transaction('uploads','readwrite');tx.objectStore('uploads').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});}
  return {readState,writeState,allFonts,putFont,removeFont,saveUpload,getUpload,deleteUpload};
})();
