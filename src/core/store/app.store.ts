import { create } from 'zustand';

type AppState = {
  isReady: boolean;
  setReady: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  isReady: false,
  setReady: () => set({ isReady: true }),
}));
