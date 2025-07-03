import { createBaseApiService, apiRequest } from './base';
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  GetUsersParams,
  UserDetail,
  UserStats,
  BlackList,
  CreateBlackListRequest,
  GetBlackListParams,
  ApiResponse,
} from '@/types';

// 기본 CRUD 작업
export const userService = createBaseApiService<
  User,
  CreateUserRequest,
  UpdateUserRequest,
  GetUsersParams
>('/users');

// 사용자 상세 정보
export async function getUserDetail(userId: number): Promise<ApiResponse<UserDetail>> {
  return apiRequest<UserDetail>(`/users/${userId}/detail`);
}

// 사용자 통계
export async function getUserStats(): Promise<ApiResponse<UserStats>> {
  return apiRequest<UserStats>('/users/stats');
}

// 사용자 상태 변경
export async function toggleUserStatus(
  userId: number,
  status: 'ACTIVE' | 'INACTIVE',
): Promise<ApiResponse<User>> {
  return apiRequest<User>(`/users/${userId}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

// 블랙리스트 관리
export const blacklistService = createBaseApiService<
  BlackList,
  CreateBlackListRequest,
  never,
  GetBlackListParams
>('/blacklist');
