/**
 * Zustand store for user settings
 */
import { create } from 'zustand';
import type { UserSettings } from '../types';
import { getUserSettings, saveUserSettings } from '../db/database';

const DEFAULT_SETTINGS: UserSettings = {
  name: '',
  default_year: new Date().getFullYear(),
  theme: 'light',
  currency: 'IDR',
  number_format: 'id',
  language: 'id',
  font_size: 'normal',
  google_client_id: '',
  budget_per_kategori: {},
  custom_income_categories: [],
  custom_expense_categories: [],
  target_tabungan: 0,
  target_pengeluaran_max: 0,
};

interface SettingsState {
  settings: UserSettings;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<UserSettings>) => Promise<void>;
  setName: (name: string) => Promise<void>;
  toggleTheme: () => Promise<void>;
  setBudget: (kategori: string, amount: number) => Promise<void>;
  addCustomCategory: (type: 'income' | 'expense', category: string) => Promise<void>;
  removeCustomCategory: (type: 'income' | 'expense', category: string) => Promise<void>;
  reorderCustomCategories: (type: 'income' | 'expense', categories: string[]) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    try {
      const stored = await getUserSettings();
      if (stored) {
        set({ settings: { ...DEFAULT_SETTINGS, ...stored }, isLoaded: true });
      } else {
        // Check localStorage for name (first visit migration)
        const storedName = localStorage.getItem('user.name');
        if (storedName) {
          const settings = { ...DEFAULT_SETTINGS, name: storedName };
          await saveUserSettings(settings);
          set({ settings, isLoaded: true });
        } else {
          set({ isLoaded: true });
        }
      }

      // Apply theme
      const { settings } = get();
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  updateSettings: async (partial) => {
    const current = get().settings;
    const updated = { ...current, ...partial };
    set({ settings: updated });
    await saveUserSettings(updated);
  },

  setName: async (name) => {
    localStorage.setItem('user.name', name);
    await get().updateSettings({ name });
  },

  toggleTheme: async () => {
    const current = get().settings.theme;
    const newTheme = current === 'light' ? 'dark' : 'light';
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    await get().updateSettings({ theme: newTheme });
  },

  setBudget: async (kategori, amount) => {
    const current = get().settings.budget_per_kategori;
    await get().updateSettings({
      budget_per_kategori: { ...current, [kategori]: amount },
    });
  },

  addCustomCategory: async (type, category) => {
    const key = type === 'income' ? 'custom_income_categories' : 'custom_expense_categories';
    const current = get().settings[key];
    if (!current.includes(category)) {
      await get().updateSettings({ [key]: [...current, category] });
    }
  },

  removeCustomCategory: async (type, category) => {
    const key = type === 'income' ? 'custom_income_categories' : 'custom_expense_categories';
    const current = get().settings[key];
    await get().updateSettings({ [key]: current.filter((c) => c !== category) });
  },

  reorderCustomCategories: async (type, categories) => {
    const key = type === 'income' ? 'custom_income_categories' : 'custom_expense_categories';
    await get().updateSettings({ [key]: categories });
  },
}));
