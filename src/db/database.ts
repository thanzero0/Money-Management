/**
 * IndexedDB database setup using the idb library
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Transaction, MonthlyMeta, UserSettings, SyncLogEntry } from '../types';

interface LedgerDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      'by-date': string;
      'by-month': string;
      'by-kategori': string;
    };
  };
  monthly_meta: {
    key: string;
    value: MonthlyMeta;
  };
  user_settings: {
    key: string;
    value: UserSettings;
  };
  sync_log: {
    key: number;
    value: SyncLogEntry;
  };
}

let dbInstance: IDBPDatabase<LedgerDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<LedgerDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<LedgerDB>('ledger_db', 1, {
    upgrade(db) {
      // Transactions store
      const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
      txStore.createIndex('by-date', 'date');
      txStore.createIndex('by-month', 'date'); // We'll slice to year-month in queries
      txStore.createIndex('by-kategori', 'kategori');

      // Monthly meta store
      db.createObjectStore('monthly_meta', { keyPath: 'year_month' });

      // User settings store
      db.createObjectStore('user_settings', { keyPath: 'name' });

      // Sync log store
      db.createObjectStore('sync_log', { autoIncrement: true });
    },
  });

  return dbInstance;
}

// ─── Transaction CRUD ───────────────────────────────────────

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  const all = await db.getAll('transactions');
  return all.filter((t) => !t.deleted_at).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.order_index - b.order_index;
  });
}

export async function getTransactionsByDate(date: string): Promise<Transaction[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('transactions', 'by-date', date);
  return all
    .filter((t) => !t.deleted_at)
    .sort((a, b) => a.order_index - b.order_index);
}

export async function getTransactionsByMonth(yearMonth: string): Promise<Transaction[]> {
  const db = await getDB();
  const all = await db.getAll('transactions');
  return all
    .filter((t) => !t.deleted_at && t.date.startsWith(yearMonth))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.order_index - b.order_index;
    });
}

export async function getTransactionsByYear(year: number): Promise<Transaction[]> {
  const db = await getDB();
  const all = await db.getAll('transactions');
  return all
    .filter((t) => !t.deleted_at && t.date.startsWith(`${year}`))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.order_index - b.order_index;
    });
}

export async function saveTransaction(tx: Transaction): Promise<void> {
  const db = await getDB();
  await db.put('transactions', tx);
}

export async function saveTransactions(txs: Transaction[]): Promise<void> {
  const db = await getDB();
  const txn = db.transaction('transactions', 'readwrite');
  for (const tx of txs) {
    await txn.store.put(tx);
  }
  await txn.done;
}

export async function softDeleteTransaction(id: string): Promise<void> {
  const db = await getDB();
  const tx = await db.get('transactions', id);
  if (tx) {
    tx.deleted_at = new Date().toISOString();
    await db.put('transactions', tx);
  }
}

export async function restoreTransaction(id: string): Promise<void> {
  const db = await getDB();
  const tx = await db.get('transactions', id);
  if (tx) {
    tx.deleted_at = null;
    await db.put('transactions', tx);
  }
}

export async function permanentDeleteTransaction(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('transactions', id);
}

// ─── Monthly Meta CRUD ──────────────────────────────────────

export async function getMonthlyMeta(yearMonth: string): Promise<MonthlyMeta | undefined> {
  const db = await getDB();
  return db.get('monthly_meta', yearMonth);
}

export async function saveMonthlyMeta(meta: MonthlyMeta): Promise<void> {
  const db = await getDB();
  await db.put('monthly_meta', meta);
}

export async function getAllMonthlyMeta(): Promise<MonthlyMeta[]> {
  const db = await getDB();
  return db.getAll('monthly_meta');
}

// ─── User Settings ──────────────────────────────────────────

const SETTINGS_KEY = 'main';

export async function getUserSettings(): Promise<UserSettings | undefined> {
  const db = await getDB();
  return db.get('user_settings', SETTINGS_KEY);
}

export async function saveUserSettings(settings: UserSettings): Promise<void> {
  const db = await getDB();
  // Ensure the key matches
  await db.put('user_settings', { ...settings, name: settings.name || SETTINGS_KEY } as any);
}

// ─── Sync Log ───────────────────────────────────────────────

export async function addSyncLog(entry: SyncLogEntry): Promise<void> {
  const db = await getDB();
  await db.add('sync_log', entry);
}

export async function getSyncLog(): Promise<SyncLogEntry[]> {
  const db = await getDB();
  return db.getAll('sync_log');
}

// ─── Bulk Operations ────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('transactions');
  await db.clear('monthly_meta');
  await db.clear('sync_log');
}

export async function exportAllData(): Promise<{
  transactions: Transaction[];
  monthly_meta: MonthlyMeta[];
  settings: UserSettings | undefined;
}> {
  const db = await getDB();
  return {
    transactions: await db.getAll('transactions'),
    monthly_meta: await db.getAll('monthly_meta'),
    settings: await getUserSettings(),
  };
}

export async function importData(data: {
  transactions?: Transaction[];
  monthly_meta?: MonthlyMeta[];
}): Promise<void> {
  const db = await getDB();

  if (data.transactions) {
    const txn = db.transaction('transactions', 'readwrite');
    for (const tx of data.transactions) {
      await txn.store.put(tx);
    }
    await txn.done;
  }

  if (data.monthly_meta) {
    const txn = db.transaction('monthly_meta', 'readwrite');
    for (const meta of data.monthly_meta) {
      await txn.store.put(meta);
    }
    await txn.done;
  }
}

export async function getTransactionCountByCategory(kategori: string): Promise<number> {
  const db = await getDB();
  const all = await db.getAllFromIndex('transactions', 'by-kategori', kategori);
  return all.filter((t) => !t.deleted_at).length;
}
