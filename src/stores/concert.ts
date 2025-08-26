// /stores/concert.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiCall } from '@/lib/api';

type Id = string | number;

export type ApiSeat = {
  id: number;
  rowName: string;
  seatNumber: string;
};

export type ApiSeatSection = {
  id: number; // 신규면 0
  sectionName: string; // 'A구역'
  colorCode: string; // '#FF0000' 등
  price: number; // 단일 가격
  seats: ApiSeat[];
};

export type ConcertDetail = {
  id: number;
  title: string;
  // ... 필요한 필드 자유롭게 확장
  seatSections: ApiSeatSection[];
  updatedAt?: string;
  updated_at?: string;
};

type ConcertState = {
  byId: Record<string, ConcertDetail | undefined>;
  loadingById: Record<string, boolean | undefined>;
  errorById: Record<string, string | null | undefined>;

  // SELECTORS
  get: (id: Id) => ConcertDetail | undefined;
  isLoading: (id: Id) => boolean;
  getError: (id: Id) => string | null;

  // ACTIONS
  fetchConcert: (id: Id) => Promise<ConcertDetail | undefined>;
  setConcert: (id: Id, data: ConcertDetail) => void;

  // Helpers
  getSeatSections: (id: Id) => ApiSeatSection[];
  clear: (id?: Id) => void;
};

export const useConcertStore = create<ConcertState>()(
  devtools((set, get) => ({
    byId: {},
    loadingById: {},
    errorById: {},

    get: (id) => get().byId[String(id)],
    isLoading: (id) => Boolean(get().loadingById[String(id)]),
    getError: (id) => get().errorById[String(id)] ?? null,

    setConcert: (id, data) =>
      set((s) => ({
        byId: { ...s.byId, [String(id)]: data },
        loadingById: { ...s.loadingById, [String(id)]: false },
        errorById: { ...s.errorById, [String(id)]: null },
      })),
    fetchConcert: async (id) => {
      const key = String(id);
      set((s) => ({
        loadingById: { ...s.loadingById, [key]: true },
        errorById: { ...s.errorById, [key]: null },
      }));
      try {
        const data = await apiCall(`/api/concerts/${id}`, { method: 'GET' });

        // 👇 원본 응답 그대로 확인
        console.groupCollapsed('[ConcertStore] fetchConcert raw response');
        console.log('id:', key);
        console.log('raw data:', data);
        console.groupEnd();

        const raw: ConcertDetail = (data?.concert ?? data) as ConcertDetail;
        const seatSections = Array.isArray(raw?.seatSections) ? raw.seatSections : [];
        const merged: ConcertDetail = { ...raw, seatSections };

        // 👇 스토어에 넣을 최종값 확인
        console.groupCollapsed('[ConcertStore] fetchConcert merged for store');
        console.log('id:', key);
        console.log('merged:', merged);
        console.groupEnd();

        set((s) => ({
          byId: { ...s.byId, [key]: merged },
          loadingById: { ...s.loadingById, [key]: false },
          errorById: { ...s.errorById, [key]: null },
        }));

        // 👇 커밋 직후 스냅샷
        console.group('[ConcertStore] state snapshot after set');
        console.log('byId:', get().byId);
        console.log('loadingById:', get().loadingById);
        console.log('errorById:', get().errorById);
        console.groupEnd();

        return merged;
      } catch (e: any) {
        console.group('[ConcertStore] fetchConcert error');
        console.log('id:', key);
        console.error(e);
        console.groupEnd();

        set((s) => ({
          loadingById: { ...s.loadingById, [key]: false },
          errorById: { ...s.errorById, [key]: e?.message || '콘서트 조회 실패' },
        }));
        return undefined;
      }
    },

    getSeatSections: (id) => {
      const c = get().get(id);
      return Array.isArray(c?.seatSections) ? c!.seatSections : [];
    },

    clear: (id) =>
      set((s) => {
        if (!id) return { byId: {}, loadingById: {}, errorById: {} };
        const key = String(id);
        const { [key]: _1, ...rest } = s.byId;
        const { [key]: _2, ...restL } = s.loadingById;
        const { [key]: _3, ...restE } = s.errorById;
        return { byId: rest, loadingById: restL, errorById: restE };
      }),
  })),
);
