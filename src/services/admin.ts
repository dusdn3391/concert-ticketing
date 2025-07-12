import { createBaseApiService, apiRequest } from './base';
import {
  Admin,
  CreateAdminRequest,
  UpdateAdminRequest,
  GetAdminsParams,
  AdminLoginRequest,
  AdminLoginResponse,
  ChangeAdminPasswordRequest,
  AdminDetail,
  AdminStats,
  ApiResponse,
} from '@/types';

// 기본 CRUD 작업
export const adminService = createBaseApiService<
  Admin,
  CreateAdminRequest,
  UpdateAdminRequest,
  GetAdminsParams
>('/admin');

// 관리자 로그인
export async function loginAdmin(
  credentials: AdminLoginRequest,
): Promise<ApiResponse<AdminLoginResponse>> {
  return apiRequest<AdminLoginResponse>('/admin/login', {
    method: 'POST',
    body: credentials,
  });
}

// 관리자 로그아웃
export async function logoutAdmin(): Promise<ApiResponse<void>> {
  return apiRequest<void>('/admin/logout', {
    method: 'POST',
  });
}

// 비밀번호 변경
export async function changeAdminPassword(
  adminId: number,
  data: ChangeAdminPasswordRequest,
): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/admin/${adminId}/password`, {
    method: 'PATCH',
    body: data,
  });
}

// 관리자 상세 정보
export async function getAdminDetail(adminId: number): Promise<ApiResponse<AdminDetail>> {
  return apiRequest<AdminDetail>(`/admin/${adminId}/detail`);
}

// 관리자 통계
export async function getAdminStats(): Promise<ApiResponse<AdminStats>> {
  return apiRequest<AdminStats>('/admin/stats');
}

// 관리자 상태 변경
export async function toggleAdminStatus(
  adminId: number,
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED',
): Promise<ApiResponse<Admin>> {
  return apiRequest<Admin>(`/admin/${adminId}/status`, {
    method: 'PATCH',
    body: { status },
  });
}
