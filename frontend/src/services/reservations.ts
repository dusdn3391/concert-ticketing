import { createBaseApiService, apiRequest } from './base';
import {
  Reservation,
  CreateReservationRequest,
  UpdateReservationRequest,
  GetReservationsParams,
  ReservationDetail,
  ReservationStats,
  SeatAvailabilityRequest,
  SeatAvailabilityResponse,
  CancelReservationRequest,
  ApiResponse,
} from '@/types';

// 예약 기본 CRUD
export const reservationService = createBaseApiService<
  Reservation,
  CreateReservationRequest,
  UpdateReservationRequest,
  GetReservationsParams
>('/reservations');

// 예약 상세 정보
export async function getReservationDetail(
  reservationId: number,
): Promise<ApiResponse<ReservationDetail>> {
  return apiRequest<ReservationDetail>(`/reservations/${reservationId}/detail`);
}

// 예약 통계
export async function getReservationStats(): Promise<ApiResponse<ReservationStats>> {
  return apiRequest<ReservationStats>('/reservations/stats');
}

// 예약 취소
export async function cancelReservation(
  reservationId: number,
  data: CancelReservationRequest,
): Promise<ApiResponse<Reservation>> {
  return apiRequest<Reservation>(`/reservations/${reservationId}/cancel`, {
    method: 'PATCH',
    body: data,
  });
}

// 좌석 예약 현황
export async function getSeatAvailability(
  data: SeatAvailabilityRequest,
): Promise<ApiResponse<SeatAvailabilityResponse>> {
  return apiRequest<SeatAvailabilityResponse>('/reservations/seat-availability', {
    method: 'POST',
    body: data,
  });
}
