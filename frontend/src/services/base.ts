// ERD 테이블 기반 API 기본 로직
import {
  ApiResponse,
  ApiErrorResponse,
  PaginationResponse,
  PaginationParams,
  SortOption,
  FilterOption,
} from '@/types';

// 환경변수
const API_BASE_URL = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL;
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000', 10);

// HTTP 메서드 타입
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API 요청 옵션
interface ApiRequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  params?: Record<string, unknown>;
}

// API 에러 클래스
export class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// 토큰 관리 함수들
export function setTokens(access: string, refresh: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }
}

export function getAccessToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('access_token');
  }
  return null;
}

export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refresh_token');
  }
  return null;
}

export function clearTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

// 쿼리 스트링 생성 함수
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          searchParams.append(key, String(item));
        });
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  return searchParams.toString();
}

// 페이지네이션 파라미터 처리
function processPaginationParams(params: PaginationParams): Record<string, unknown> {
  return {
    page: params.page || 1,
    limit: Math.min(params.limit || 20, 100), // 최대 100개 제한
  };
}

// 정렬 파라미터 처리
function processSortParams(sort?: SortOption): Record<string, unknown> {
  if (!sort) {
    return {};
  }

  return {
    sort_field: sort.field,
    sort_direction: sort.direction,
  };
}

// 필터 파라미터 처리
function processFilterParams(filters?: FilterOption[]): Record<string, unknown> {
  if (!filters || filters.length === 0) {
    return {};
  }

  const filterParams: Record<string, unknown> = {};

  filters.forEach((filter, index) => {
    const prefix = `filter_${index}`;
    filterParams[`${prefix}_field`] = filter.field;
    filterParams[`${prefix}_value`] = filter.value;
    filterParams[`${prefix}_operator`] = filter.operator || 'eq';
  });

  return filterParams;
}

// 토큰 갱신 함수
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();

    if (data.success && data.data.access_token) {
      setTokens(data.data.access_token, refreshToken);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

// 기본 API 요청 함수
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = API_TIMEOUT,
    params = {},
  } = options;

  // URL 생성
  let url = `${API_BASE_URL}${endpoint}`;

  if (Object.keys(params).length > 0) {
    const queryString = buildQueryString(params);
    url += `?${queryString}`;
  }

  // 헤더 설정
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // 인증 토큰 추가
  const accessToken = getAccessToken();
  if (accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  // 요청 옵션
  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
  };

  // Body 추가 (GET 요청이 아닌 경우)
  if (method !== 'GET' && body !== undefined) {
    if (body instanceof FormData) {
      // FormData인 경우 Content-Type 헤더 제거 (브라우저가 자동 설정)
      delete requestHeaders['Content-Type'];
      requestOptions.body = body;
    } else {
      requestOptions.body = JSON.stringify(body);
    }
  }

  // AbortController로 타임아웃 처리
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  requestOptions.signal = controller.signal;

  try {
    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId);

    // 401 Unauthorized인 경우 토큰 갱신 시도
    if (response.status === 401 && accessToken) {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        // 토큰 갱신 성공 시 요청 재시도
        const newAccessToken = getAccessToken();
        if (newAccessToken) {
          requestHeaders.Authorization = `Bearer ${newAccessToken}`;
          const retryResponse = await fetch(url, {
            ...requestOptions,
            headers: requestHeaders,
          });

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            return retryData;
          }
        }
      }

      // 토큰 갱신 실패 시 로그아웃 처리
      clearTokens();

      // 로그인 페이지로 리다이렉트 (클라이언트 사이드에서만)
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
    }

    if (!response.ok) {
      let errorData: ApiErrorResponse;

      try {
        errorData = await response.json();
      } catch {
        errorData = {
          success: false,
          error: 'UNKNOWN_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      throw new ApiError(errorData.message, response.status, errorData.error, errorData);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('요청 시간이 초과되었습니다.', 408, 'TIMEOUT');
    }

    throw new ApiError('네트워크 오류가 발생했습니다.', 0, 'NETWORK_ERROR', error);
  }
}

// CRUD 작업을 위한 기본 API 함수들
export function createBaseApiService<
  TEntity,
  TCreateRequest,
  TUpdateRequest,
  TGetParams extends PaginationParams = PaginationParams,
>(endpoint: string) {
  return {
    // 목록 조회
    async getList(params: TGetParams): Promise<ApiResponse<PaginationResponse<TEntity>>> {
      const queryParams = {
        ...processPaginationParams(params),
        ...processSortParams((params as unknown as { sort?: SortOption }).sort),
        ...processFilterParams(
          (params as unknown as { filters?: FilterOption[] }).filters,
        ),
        ...params,
      };

      return apiRequest<PaginationResponse<TEntity>>(endpoint, {
        method: 'GET',
        params: queryParams,
      });
    },

    // 단일 조회
    async getById(id: number | string): Promise<ApiResponse<TEntity>> {
      return apiRequest<TEntity>(`${endpoint}/${id}`);
    },

    // 생성
    async create(data: TCreateRequest): Promise<ApiResponse<TEntity>> {
      return apiRequest<TEntity>(endpoint, {
        method: 'POST',
        body: data,
      });
    },

    // 수정
    async update(
      id: number | string,
      data: TUpdateRequest,
    ): Promise<ApiResponse<TEntity>> {
      return apiRequest<TEntity>(`${endpoint}/${id}`, {
        method: 'PUT',
        body: data,
      });
    },

    // 부분 수정
    async patch(
      id: number | string,
      data: Partial<TUpdateRequest>,
    ): Promise<ApiResponse<TEntity>> {
      return apiRequest<TEntity>(`${endpoint}/${id}`, {
        method: 'PATCH',
        body: data,
      });
    },

    // 삭제
    async delete(id: number | string): Promise<ApiResponse<void>> {
      return apiRequest<void>(`${endpoint}/${id}`, {
        method: 'DELETE',
      });
    },

    // 대량 삭제
    async bulkDelete(ids: number[]): Promise<ApiResponse<void>> {
      return apiRequest<void>(`${endpoint}/bulk`, {
        method: 'DELETE',
        body: { ids },
      });
    },

    // 통계 조회
    async getStats(): Promise<ApiResponse<unknown>> {
      return apiRequest<unknown>(`${endpoint}/stats`);
    },

    // 커스텀 액션 실행
    async customAction<TResponse = unknown>(
      action: string,
      data?: unknown,
      method: HttpMethod = 'POST',
    ): Promise<ApiResponse<TResponse>> {
      return apiRequest<TResponse>(`${endpoint}/${action}`, {
        method,
        body: data,
      });
    },
  };
}

// 파일 업로드
export async function uploadFile(
  file: File,
  endpoint: string = '/upload',
): Promise<ApiResponse<{ url: string }>> {
  const formData = new FormData();
  formData.append('file', file);

  return apiRequest<{ url: string }>(endpoint, {
    method: 'POST',
    body: formData,
  });
}

// 여러 파일 업로드
export async function uploadFiles(
  files: File[],
  endpoint: string = '/upload',
): Promise<ApiResponse<{ urls: string[] }>> {
  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append(`file_${index}`, file);
  });

  return apiRequest<{ urls: string[] }>(endpoint, {
    method: 'POST',
    body: formData,
  });
}

// 파일 다운로드
export async function downloadFile(url: string, filename?: string): Promise<void> {
  const response = await fetch(url);
  const blob = await response.blob();

  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

// 엑셀 다운로드
export async function downloadExcel(
  endpoint: string,
  params?: Record<string, unknown>,
): Promise<void> {
  const queryString = params ? `?${buildQueryString(params)}` : '';
  const url = `${API_BASE_URL}${endpoint}/excel${queryString}`;

  const accessToken = getAccessToken();
  const headers: Record<string, string> = {};

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(url, { headers });
  const blob = await response.blob();

  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `${endpoint.replace('/', '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

// 이미지 미리보기 URL 생성
export function getImagePreviewUrl(
  imageUrl: string,
  width?: number,
  height?: number,
): string {
  if (!imageUrl) {
    return '';
  }

  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  let url = `${API_BASE_URL}/images/${imageUrl}`;

  if (width || height) {
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    url += `?${params.toString()}`;
  }

  return url;
}

// 날짜 범위 검색 파라미터 생성
export function createDateRangeParams(
  dateFrom?: string,
  dateTo?: string,
  field: string = 'created_at',
): Record<string, string> {
  const params: Record<string, string> = {};

  if (dateFrom) {
    params[`${field}_from`] = dateFrom;
  }

  if (dateTo) {
    params[`${field}_to`] = dateTo;
  }

  return params;
}

// 정렬 파라미터 생성
export function createSortParams(field: string, direction: 'asc' | 'desc'): SortOption {
  return { field, direction };
}

// 필터 파라미터 생성
export function createFilterParams(
  filters: Array<{ field: string; value: unknown; operator?: string }>,
): FilterOption[] {
  return filters.map((filter) => ({
    field: filter.field,
    value: filter.value as string | number | boolean,
    operator: (filter.operator as FilterOption['operator']) || 'eq',
  }));
}

// 에러 처리 헬퍼
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '알 수 없는 오류가 발생했습니다.';
}

// 디바운스 유틸리티 (검색 등에 사용)
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number,
): T {
  let timeout: NodeJS.Timeout;

  return ((...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  }) as T;
}

// API 응답 검증 헬퍼
export function validateApiResponse<T>(response: unknown): response is ApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    'data' in response
  );
}

// 로딩 상태 관리 (Zustand와 함께 사용)
export interface ApiState {
  isLoading: boolean;
  error: ApiError | null;
}

export function createApiState(): ApiState {
  return {
    isLoading: false,
    error: null,
  };
}

export function setApiLoading(state: ApiState, loading: boolean): ApiState {
  return {
    ...state,
    isLoading: loading,
  };
}

export function setApiError(state: ApiState, error: ApiError | null): ApiState {
  return {
    ...state,
    error,
    isLoading: false,
  };
}

export function clearApiError(state: ApiState): ApiState {
  return {
    ...state,
    error: null,
  };
}

// API 훅을 위한 헬퍼 함수들
export function createApiHookHelpers<T>(apiCall: () => Promise<ApiResponse<T>>) {
  return {
    async execute(): Promise<T | null> {
      try {
        const response = await apiCall();
        if (response.success) {
          return response.data;
        }
        throw new ApiError(response.message || '요청 실패', 0, 'API_ERROR');
      } catch (error) {
        throw error;
      }
    },
  };
}

export default apiRequest;
