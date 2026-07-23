import api from '../services/api';

export interface PanicOptions {
  password?: string;
  deleteMode?: 'LOCAL_AND_CLOUD' | 'LOCAL_ONLY';
}

/**
 * Executes Emergency Delete (Panic Mode)
 * Disconnects active connections, purges cloud user data, clears local storage/caches, and redirects to login.
 */
export const executePanicMode = async (options: PanicOptions = {}) => {
  const mode = options.deleteMode || 'LOCAL_AND_CLOUD';

  try {
    // 1. Trigger Cloud Panic Delete API if enabled
    if (mode === 'LOCAL_AND_CLOUD') {
      await api.post('/users/panic-delete', {
        password: options.password,
        mode,
      });
    }
  } catch (err) {
    console.error('Cloud Panic Delete API error:', err);
  }

  try {
    // 2. Clear LocalStorage and SessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // 3. Clear IndexedDB databases if supported
    if (window.indexedDB && indexedDB.databases) {
      try {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      } catch (e) {
        console.error('IndexedDB clear error:', e);
      }
    }

    // 4. Clear Cache Storage
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      } catch (e) {
        console.error('Cache Storage clear error:', e);
      }
    }

    // 5. Unregister Service Workers
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          registration.unregister();
        }
      } catch (e) {
        console.error('ServiceWorker unregister error:', e);
      }
    }
  } catch (err) {
    console.error('Local cache purge error:', err);
  }

  // 6. Hard redirect to clean login state
  window.location.href = '/login';
};
