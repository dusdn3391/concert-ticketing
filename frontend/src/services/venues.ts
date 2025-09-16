import { createBaseApiService, apiRequest } from './base';
import { ApiResponse } from '@/types';

// ERD 기반 콘서트장 타입들
interface ConcertHall {
  id: number;
  concert_hall_name: string;
  admin_id: number;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface ConcertHallArea {
  id: number;
  area_name: string;
  concert_hall_id: number;
  x: number;
  y: number;
  ui_metadata: Record<string, unknown>;
  created_at: string;
}

interface Seat {
  id: number;
  concert_hall_area_id: number;
  seat_name: string;
  x: number;
  y: number;
  ui_metadata: Record<string, unknown>;
}

// 콘서트장 기본 CRUD
export const concertHallService = createBaseApiService<
  ConcertHall,
  Omit<ConcertHall, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>,
  Partial<
    Omit<ConcertHall, 'id' | 'admin_id' | 'created_at' | 'updated_at' | 'deleted_at'>
  >,
  { page: number; limit: number; admin_id?: number }
>('/concert-halls');

// 콘서트장 구역 관리
export const concertHallAreaService = createBaseApiService<
  ConcertHallArea,
  Omit<ConcertHallArea, 'id' | 'created_at'>,
  Partial<Omit<ConcertHallArea, 'id' | 'concert_hall_id' | 'created_at'>>,
  { page: number; limit: number; concert_hall_id?: number }
>('/concert-hall-areas');

// 좌석 관리
export const seatService = createBaseApiService<
  Seat,
  Omit<Seat, 'id'>,
  Partial<Omit<Seat, 'id' | 'concert_hall_area_id'>>,
  { page: number; limit: number; concert_hall_area_id?: number }
>('/seats');

// 대량 좌석 생성
export async function bulkCreateSeats(
  areaId: number,
  seats: Omit<Seat, 'id' | 'concert_hall_area_id'>[],
): Promise<ApiResponse<Seat[]>> {
  return apiRequest<Seat[]>(`/concert-hall-areas/${areaId}/bulk-seats`, {
    method: 'POST',
    body: { seats },
  });
}
