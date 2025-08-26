import { create } from 'zustand';

interface Zone {
  id: string;
  name: string;
  color: string;
  seatCount: number;
  priceCategory: string;
}

interface Venue {
  id: string;
  title: string;
  description: string;
  location: string;
  thumbnailImage: string;
  capacity: 'default' | 'small' | 'medium' | 'large' | 'xlarge';
  venueType: 'indoor' | 'outdoor' | 'mixed';
  floorCount: number;
  estimatedSeats: number;
  svgData?: string | null;
  zones: Zone[];
  createdAt: string;
  updatedAt: string;
}

// ===== 콘서트 생성 관련 타입 =====
interface ConcertRound {
  id: number;
  date: string; // 'YYYY-MM-DD'
  startTime: string; // 'HH:mm'
}

type ImagesRole = 'THUMBNAIL' | 'DETAIL';

interface ScheduleItem {
  concertTime: string; // ISO
}

interface ImageItem {
  id: number;
  imageUrl: string;
  imagesRole: ImagesRole;
}

interface CastItem {
  id: number;
  name: string;
}

interface ConcertCreateData {
  // 필수
  title: string;
  description: string;
  location: string;
  locationX: number;
  locationY: number;
  reservationStartDate: string; // ISO 또는 'YYYY-MM-DDTHH:mm'
  reservationEndDate: string; // ISO 또는 'YYYY-MM-DDTHH:mm'
  price: string;
  limitAge: number;
  durationTime: number; // 분

  // 회차/스케줄 (둘 중 하나만 줘도 됨)
  concertRounds?: ConcertRound[]; // {date:'YYYY-MM-DD', startTime:'HH:mm'}
  schedules?: ScheduleItem[]; // 이미 ISO로 만든 경우

  // 선택/추가 (백엔드 스키마 반영)
  startDate?: string; // 없으면 회차/스케줄 기준 자동 계산 ('YYYY-MM-DD')
  endDate?: string; // 없으면 회차/스케줄 기준 자동 계산 ('YYYY-MM-DD')
  rating?: number; // 기본 0
  concertTag?: string;
  adminId?: number;
  concertHallId?: number;
  casts?: CastItem[];

  // 파일 업로드 방식
  thumbnailImage?: File;
  descriptionImages?: File[]; // 여러 장
  seatMap?: File; // SVG 등 좌석도 파일(선택)

  // URL 기반 이미지(JSON 전송 모드에서 사용)
  images?: ImageItem[];
}

interface VenueStore {
  venues: Venue[];
  loading: boolean;
  error: string | null;

  // Actions
  getVenue: (id: string) => Promise<Venue | null>;
  getVenues: () => Promise<Venue[]>;
  createVenue: (venue: Omit<Venue, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Venue>;
  createConcert: (concertData: ConcertCreateData) => Promise<any>;
  updateVenue: (id: string, venue: Partial<Venue>) => Promise<Venue>;
  deleteVenue: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const toIso = (d: string, t: string) => `${d}T${t}:00`;
const addMinutes = (iso: string, minutes: number) => {
  const dt = new Date(iso);
  dt.setMinutes(dt.getMinutes() + minutes);
  return dt.toISOString();
};
const toYMD = (iso: string) => new Date(iso).toISOString().slice(0, 10); // 'YYYY-MM-DD'

export const useVenueStore = create<VenueStore>((set, get) => ({
  venues: [],
  loading: false,
  error: null,

  getVenue: async (id: string) => {
    try {
      set({ loading: true, error: null });

      const response = await fetch(`/api/admin/venues/${id}`);
      if (!response.ok) throw new Error('공연장을 찾을 수 없습니다.');

      const venue = await response.json();
      return venue;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      set({ error: errorMessage });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  getVenues: async () => {
    try {
      set({ loading: true, error: null });

      const response = await fetch('/admin/concert-halls');
      if (!response.ok) throw new Error('공연장 목록을 불러올 수 없습니다.');

      const venues = await response.json();
      set({ venues });
      return venues;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      set({ error: errorMessage });
      return [];
    } finally {
      set({ loading: false });
    }
  },

  // ✅ 공연장 생성은 공연장 API로
  createVenue: async (venueData) => {
    try {
      set({ loading: true, error: null });

      const baseUrl = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL || '';
      const token = localStorage.getItem('admin_token');

      const response = await fetch(`${baseUrl}/admin/concert-halls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(venueData),
      });

      if (!response.ok) throw new Error('공연장 생성에 실패했습니다.');

      const newVenue = await response.json();
      set((state) => ({ venues: [...state.venues, newVenue] }));
      return newVenue;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  createConcert: async (concertData: ConcertCreateData) => {
    try {
      set({ loading: true, error: null });

      const baseUrl =
        process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL || 'http://localhost:8080';
      const token = localStorage.getItem('admin_token');
      if (!token) throw new Error('인증 토큰이 없습니다. 다시 로그인해주세요.');

      // 1) 모든 회차 -> schedules 배열로 변환
      if (!concertData.concertRounds || concertData.concertRounds.length === 0) {
        throw new Error('회차(concertRounds)가 필요합니다.');
      }

      console.groupCollapsed('🧾 원본 concertRounds');
      console.table(
        concertData.concertRounds.map((r) => ({
          id: r.id,
          date: r.date,
          time: r.startTime,
        })),
      );
      console.groupEnd();

      // ... createConcert 내부

      // 🔁 회차 정렬 (그대로 유지)
      const rounds = [...concertData.concertRounds]
        .filter((r) => r.date && r.startTime)
        .sort(
          (a, b) =>
            new Date(`${a.date}T${a.startTime}`).getTime() -
            new Date(`${b.date}T${b.startTime}`).getTime(),
        );

      // ✅ 각 회차 → ISO 로 바꾼 concertTime 목록
      const concertTimes = rounds.map((r) =>
        new Date(toIso(r.date, r.startTime)).toISOString(),
      );

      // ✅ scheduleRequests: [{ concertTime }]
      const scheduleRequests: ScheduleItem[] = concertTimes.map((ct) => ({
        concertTime: ct,
      }));

      console.groupCollapsed('✅ scheduleRequests (concertTime only)');
      console.table(scheduleRequests);
      console.groupEnd();

      // ✅ 기간(YYYY-MM-DD)도 concertTimes 기준으로 추론
      const inferredStartDate = concertTimes[0]
        ? toYMD(concertTimes[0])
        : new Date().toISOString().slice(0, 10);
      const inferredEndDate = concertTimes.at(-1)
        ? toYMD(concertTimes.at(-1)!)
        : inferredStartDate;

      const startDate = concertData.startDate ?? inferredStartDate;
      const endDate = concertData.endDate ?? inferredEndDate;

      // 3) 공통 요청 본문 (🔹 schedule은 여기서 제외!)
      const baseRequest = {
        id: 0,
        title: concertData.title,
        description: concertData.description,
        location: concertData.location,
        locationX: concertData.locationX,
        locationY: concertData.locationY,
        startDate,
        endDate,
        reservationStartDate: new Date(concertData.reservationStartDate).toISOString(),
        reservationEndDate: new Date(concertData.reservationEndDate).toISOString(),
        price: concertData.price,
        rating: concertData.rating ?? 0,
        limitAge: concertData.limitAge,
        durationTime: concertData.durationTime,
        concertTag: concertData.concertTag ?? 'string',
        adminId: concertData.adminId ?? 0,
        concertHallId: concertData.concertHallId ?? 0,
        casts: concertData.casts ?? [],
      };

      // 4) 파일 유무에 따라 전송 방식 선택
      const hasFiles =
        !!concertData.thumbnailImage ||
        (concertData.descriptionImages && concertData.descriptionImages.length > 0) ||
        !!concertData.seatMap;

      if (hasFiles) {
        // 🔹 multipart: concertRequest + scheduleRequests + files
        const concertRequest = {
          ...baseRequest,
          images: [] as any[], // 서버가 파일 저장 후 메타를 채움
          seatMap: undefined as any,
        };
        console.log('🧾 multipart concertRequest:', concertRequest);

        const formData = new FormData();
        formData.append(
          'concertRequest',
          new Blob([JSON.stringify(concertRequest)], { type: 'application/json' }),
        );

        formData.append(
          'scheduleRequests',
          new Blob([JSON.stringify(scheduleRequests)], { type: 'application/json' }),
        );

        if (concertData.thumbnailImage) {
          formData.append('thumbnailImage', concertData.thumbnailImage);
        }
        if (concertData.descriptionImages?.length) {
          concertData.descriptionImages.forEach((img) => {
            formData.append('descriptionImage', img);
          });
        }
        if (concertData.seatMap) {
          formData.append('seatMap', concertData.seatMap);
        }

        const response = await fetch(`${baseUrl}/api/concerts/create`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }, // Content-Type 지정 금지
          body: formData,
        });
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`콘서트 생성에 실패했습니다: ${response.status} ${errorData}`);
        }
        return await response.json();
      } else {
        const payload = {
          ...baseRequest,
          scheduleRequests,
          images: (concertData.images ?? []).map((img, idx) => ({
            id: img.id ?? idx,
            imageUrl: img.imageUrl,
            imagesRole: img.imagesRole,
          })),
          seatMap: null as any,
        };

        const response = await fetch(`${baseUrl}/api/concerts/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`콘서트 생성에 실패했습니다: ${response.status} ${errorData}`);
        }
        return await response.json();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      console.error('❌ 콘서트 생성 오류:', errorMessage);
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateVenue: async (id, venueData) => {
    try {
      set({ loading: true, error: null });

      const response = await fetch(`/api/admin/venues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venueData),
      });

      if (!response.ok) throw new Error('공연장 수정에 실패했습니다.');

      const updatedVenue = await response.json();
      set((state) => ({
        venues: state.venues.map((venue) => (venue.id === id ? updatedVenue : venue)),
      }));
      return updatedVenue;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteVenue: async (id) => {
    try {
      set({ loading: true, error: null });

      const response = await fetch(`/api/admin/venues/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('공연장 삭제에 실패했습니다.');

      set((state) => ({ venues: state.venues.filter((venue) => venue.id !== id) }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
