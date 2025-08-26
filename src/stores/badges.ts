// /stores/badges.ts
import { create } from 'zustand';

interface AdminBadgeState {
  concertCount: number;
  setConcertCount: (n: number) => void;
}

export const useAdminBadgeStore = create<AdminBadgeState>((set) => ({
  concertCount: 0,
  setConcertCount: (n) => set({ concertCount: n }),
}));
