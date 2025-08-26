// API 설정 및 유틸리티 함수들

// API Base URL 설정
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL;

// API 호출을 위한 기본 설정
export const getApiUrl = (endpoint: string): string => {
  // endpoint가 '/'로 시작하지 않으면 추가
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

// 인증 헤더 생성
export const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 토큰이 있으면 Authorization 헤더 추가
  let token = process.env.NEXT_PUBLIC_ADMIN_TOKEN;

  // 환경변수에 토큰이 없으면 localStorage에서 가져오기
  if (!token && typeof window !== 'undefined') {
    token = localStorage.getItem('admin_token') || undefined;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

// API 호출 래퍼 함수
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = getApiUrl(endpoint);
  const defaultOptions: RequestInit = {
    headers: getAuthHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API 호출 오류:', error);
    throw error;
  }
};
