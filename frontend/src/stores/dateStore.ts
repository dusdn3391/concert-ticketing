// stores/dateStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SelectedSeat = { id: number; rowName: string; seatNumber: string };

type DateState = {
  selectedDate: Date | null;

  // ✅ 선택된 회차(=날짜/시간 슬롯)의 ID
  selectedScheduleId: number | null;

  // 좌석 선택 관련
  selectedSectionId: number | null;
  selectedSeats: SelectedSeat[];
  seatCount: number;
  totalPrice: number;

  // 포스터
  posterUrl: string | null;

  // actions
  setSelectedDate: (d: Date | null) => void;
  setSelectedScheduleId: (id: number | null) => void; // ✅ 추가
  updateSeatSelection: (payload: {
    sectionId: number | null;
    seats: SelectedSeat[];
    pricePerSeat?: number;
  }) => void;
  clearSeatSelection: () => void;
  setPosterUrl: (url: string | null) => void;
};

export const useDateStore = create<DateState>()(
  persist(
    (set) => ({
      selectedDate: null,
      selectedScheduleId: null, // ✅ 초기값

      selectedSectionId: null,
      selectedSeats: [],
      seatCount: 0,
      totalPrice: 0,

      posterUrl: null,

      setSelectedDate: (d) => set({ selectedDate: d }),
      setSelectedScheduleId: (id) => set({ selectedScheduleId: id }), // ✅ 추가

      updateSeatSelection: ({ sectionId, seats, pricePerSeat = 0 }) =>
        set(() => {
          const safeSeats = Array.isArray(seats) ? seats.slice(0, 2) : [];
          const seatCount = safeSeats.length;
          const totalPrice = seatCount * Number(pricePerSeat || 0);
          return {
            selectedSectionId: sectionId ?? null,
            selectedSeats: safeSeats,
            seatCount,
            totalPrice,
          };
        }),

      clearSeatSelection: () =>
        set({
          selectedSectionId: null,
          selectedSeats: [],
          seatCount: 0,
          totalPrice: 0,
        }),

      setPosterUrl: (url) => set({ posterUrl: url }),
    }),
    {
      name: 'date-store',
      partialize: (s) => ({
        selectedDate: s.selectedDate ? s.selectedDate.toISOString() : null,
        selectedScheduleId: s.selectedScheduleId, // ✅ 저장
        selectedSectionId: s.selectedSectionId,
        selectedSeats: s.selectedSeats,
        seatCount: s.seatCount,
        totalPrice: s.totalPrice,
        posterUrl: s.posterUrl,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && (state as any).selectedDate) {
          const iso = (state as any).selectedDate;
          (state as any).selectedDate = iso ? new Date(iso) : null;
        }
        // (선택) 과거에 selectedRoundId를 쓰던 경우 자동 이관
        if (
          state &&
          (state as any).selectedRoundId &&
          !(state as any).selectedScheduleId
        ) {
          (state as any).selectedScheduleId = (state as any).selectedRoundId;
        }
      },
    },
  ),
);
