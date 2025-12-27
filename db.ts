import { Product, Sale, RepairJob, Supplier, AuditLog, User, ShopSettings } from './types';

const STORAGE_KEYS = {
  PRODUCTS: 'sna_products',
  SALES: 'sna_sales',
  REPAIRS: 'sna_repairs',
  SUPPLIERS: 'sna_suppliers',
  AUDIT: 'sna_audit',
  USERS: 'sna_users',
  CURRENT_USER: 'sna_session_user',
  SETTINGS: 'sna_settings',
  SYNC_QUEUE: 'sna_sync_queue'
};

// Internal helper to handle persistence
const getLocal = <T,>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setLocal = <T,>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 11);
};

export const db = {
  products: {
    getAll: async () => getLocal<Product[]>(STORAGE_KEYS.PRODUCTS, []),
    save: async (products: Product[]) => {
      setLocal(STORAGE_KEYS.PRODUCTS, products);
      await db.sync.enqueue('PRODUCTS', products);
    },
  },
  sales: {
    getAll: async () => getLocal<Sale[]>(STORAGE_KEYS.SALES, []),
    save: async (sales: Sale[]) => {
      setLocal(STORAGE_KEYS.SALES, sales);
      await db.sync.enqueue('SALES', sales);
    },
  },
  repairs: {
    getAll: async () => getLocal<RepairJob[]>(STORAGE_KEYS.REPAIRS, []),
    save: async (repairs: RepairJob[]) => {
      setLocal(STORAGE_KEYS.REPAIRS, repairs);
      await db.sync.enqueue('REPAIRS', repairs);
    },
  },
  suppliers: {
    getAll: async () => getLocal<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []),
    save: async (suppliers: Supplier[]) => {
      setLocal(STORAGE_KEYS.SUPPLIERS, suppliers);
      await db.sync.enqueue('SUPPLIERS', suppliers);
    },
  },
  users: {
    getAll: async () => getLocal<User[]>(STORAGE_KEYS.USERS, []),
    save: async (users: User[]) => {
      setLocal(STORAGE_KEYS.USERS, users);
      await db.sync.enqueue('USERS', users);
    },
  },
  settings: {
    get: async () => getLocal<ShopSettings>(STORAGE_KEYS.SETTINGS, {
      businessName: 'SNA! MOBILE',
      tagline: 'Phones • Repairs • Accessories',
      address: 'Kampala Road, Plot 12, Shop G04',
      phone: '+256 700 000 000',
      tin: '1000-1234-56',
      receiptFooter: 'Thank you for shopping with us!',
      currency: 'UGX',
      taxEnabled: false,
      taxRate: 0,
      postgresUrl: '',
      postgresKey: '',
      syncEnabled: false
    }),
    save: async (settings: ShopSettings) => {
      setLocal(STORAGE_KEYS.SETTINGS, settings);
    },
  },
  audit: {
    getAll: async () => getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT, []),
    add: async (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
      const logs = getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT, []);
      const newLog = { ...log, id: generateId(), timestamp: new Date().toISOString() };
      const updated = [newLog, ...logs].slice(0, 100);
      setLocal(STORAGE_KEYS.AUDIT, updated);
      await db.sync.enqueue('AUDIT', updated);
    }
  },
  auth: {
    getCurrentUser: () => getLocal<User | null>(STORAGE_KEYS.CURRENT_USER, null),
    setCurrentUser: (user: User | null) => setLocal(STORAGE_KEYS.CURRENT_USER, user),
  },
  utils: {
    resetDatabase: async () => {
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
      window.location.reload();
    }
  },
  sync: {
    enqueue: async (entity: string, data: any) => {
      const queue = getLocal<any[]>(STORAGE_KEYS.SYNC_QUEUE, []);
      queue.push({ id: generateId(), entity, data, timestamp: new Date().toISOString() });
      setLocal(STORAGE_KEYS.SYNC_QUEUE, queue);
    },
    getQueue: () => getLocal<any[]>(STORAGE_KEYS.SYNC_QUEUE, []),
    clearQueue: () => setLocal(STORAGE_KEYS.SYNC_QUEUE, []),
    performSync: async () => {
      const settings = await db.settings.get();
      if (!settings.syncEnabled) return 'OFFLINE';
      if (!settings.postgresUrl) return 'OFFLINE';
      
      const queue = db.sync.getQueue();
      if (queue.length === 0) return 'SYNCED';

      try {
        // Log synchronization attempt
        console.log(`📡 CloudSync: Pushing ${queue.length} updates to PostgreSQL...`);
        
        // Simulating the actual network call to a Supabase/Postgres API
        const response = await new Promise((resolve) => setTimeout(() => {
          // Success rate simulation (95%)
          resolve(Math.random() > 0.05 ? { ok: true } : { ok: false });
        }, 2000));

        if ((response as any).ok) {
          db.sync.clearQueue();
          return 'SYNCED';
        } else {
          throw new Error("Target database unreachable");
        }
      } catch (e) {
        console.warn('❌ CloudSync: Handshake failed. Retrying in next cycle.');
        return 'FAILED';
      }
    }
  }
};