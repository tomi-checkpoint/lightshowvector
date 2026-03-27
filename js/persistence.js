const DB_NAME = 'trippingfest';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('recordings')) {
        const store = db.createObjectStore('recordings', { keyPath: 'id', autoIncrement: true });
        store.createIndex('createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'name' });
      }
      if (!db.objectStoreNames.contains('drawings')) {
        const store = db.createObjectStore('drawings', { keyPath: 'id', autoIncrement: true });
        store.createIndex('createdAt', 'createdAt');
      }
    };
  });
}

function tx(db, storeName, mode = 'readonly') {
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const DB = {
  async saveRecording(name, data, thumbnail, isDemo = false) {
    const db = await openDB();
    const store = tx(db, 'recordings', 'readwrite');
    return promisify(store.add({
      name,
      data,
      thumbnail,
      isDemo,
      createdAt: Date.now()
    }));
  },

  async getRecordings() {
    const db = await openDB();
    const store = tx(db, 'recordings');
    return promisify(store.getAll());
  },

  async deleteRecording(id) {
    const db = await openDB();
    const store = tx(db, 'recordings', 'readwrite');
    return promisify(store.delete(id));
  },

  async saveSettings(name, config) {
    const db = await openDB();
    const store = tx(db, 'settings', 'readwrite');
    return promisify(store.put({ name, ...config }));
  },

  async getSettings(name) {
    const db = await openDB();
    const store = tx(db, 'settings');
    return promisify(store.get(name));
  },

  async listSettings() {
    const db = await openDB();
    const store = tx(db, 'settings');
    return promisify(store.getAllKeys());
  },

  async saveDrawing(name, imageBlob, thumbnailBlob) {
    const db = await openDB();
    const store = tx(db, 'drawings', 'readwrite');
    return promisify(store.add({
      name,
      imageData: imageBlob,
      thumbnail: thumbnailBlob,
      createdAt: Date.now()
    }));
  },

  async getDrawings() {
    const db = await openDB();
    const store = tx(db, 'drawings');
    return promisify(store.getAll());
  }
};
