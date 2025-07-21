import { createBaseApiService, apiRequest } from './base';
import {
  Concert,
  CreateConcertRequest,
  UpdateConcertRequest,
  GetConcertsParams,
  ConcertDetail,
  ConcertStats,
  ConcertSchedule,
  CreateConcertScheduleRequest,
  Cast,
  CreateCastRequest,
  GetCastsParams,
  ApiResponse
} from '@/types';

// 콘서트 기본 CRUD
export const concertService = createBaseApiService<
  Concert,
  CreateConcertRequest,
  UpdateConcertRequest,
  GetConcertsParams
>('/concerts');

// 콘서트 상세 정보
export async function getConcertDetail(
  concertId: number,
): Promise<ApiResponse<ConcertDetail>> {
  return apiRequest<ConcertDetail>(`/concerts/${concertId}/detail`);
}

// 콘서트 통계
export async function getConcertStats(): Promise<ApiResponse<ConcertStats>> {
  return apiRequest<ConcertStats>('/concerts/stats');
}

// 콘서트 복제
export async function duplicateConcert(concertId: number): Promise<ApiResponse<Concert>> {
  return apiRequest<Concert>(`/concerts/${concertId}/duplicate`, {
    method: 'POST',
  });
}

// 콘서트 스케줄 관리
export async function getConcertSchedules(
  concertId: number,
): Promise<ApiResponse<ConcertSchedule[]>> {
  return apiRequest<ConcertSchedule[]>(`/concerts/${concertId}/schedules`);
}

export async function createConcertSchedule(
  concertId: number,
  data: CreateConcertScheduleRequest,
): Promise<ApiResponse<ConcertSchedule>> {
  return apiRequest<ConcertSchedule>(`/concerts/${concertId}/schedules`, {
    method: 'POST',
    body: data,
  });
}

// 출연진 관리
export const castService = createBaseApiService<
  Cast,
  CreateCastRequest,
  { name?: string },
  GetCastsParams
>('/casts');
