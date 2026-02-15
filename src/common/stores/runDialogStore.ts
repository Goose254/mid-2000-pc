import { create } from 'zustand';

const MAX_HISTORY_ENTRIES = 12;

interface RunDialogState {
  history: string[];
  addHistoryEntry: (entry: string) => void;
}

export const useRunDialogStore = create<RunDialogState>((set) => ({
  history: [],
  addHistoryEntry: (entry) =>
    set((state) => {
      const normalizedEntry = entry.trim();
      if (!normalizedEntry) return state;

      const uniqueHistory = state.history.filter(
        (historyEntry) => historyEntry.toLowerCase() !== normalizedEntry.toLowerCase()
      );

      return {
        history: [normalizedEntry, ...uniqueHistory].slice(0, MAX_HISTORY_ENTRIES),
      };
    }),
}));
