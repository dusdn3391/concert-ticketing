// 인증 관련 유틸리티 함수들

export interface AdminInfo {
  id: number;
  admin_id: string;
  email: string;
  role: string;
  company: string;
}

// 토큰 저장
export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_token', token);
  }
};

// 토큰 조회
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_token');
  }
  return null;
};

// 토큰 제거
export const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
  }
};

// 관리자 정보 저장
export const setAdminInfo = (adminInfo: AdminInfo): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_info', JSON.stringify(adminInfo));
  }
};

// 관리자 정보 조회
export const getAdminInfo = (): AdminInfo | null => {
  if (typeof window !== 'undefined') {
    const adminInfo = localStorage.getItem('admin_info');
    return adminInfo ? JSON.parse(adminInfo) : null;
  }
  return null;
};

// 로그인 상태 확인
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  const adminInfo = getAdminInfo();
  return !!(token && adminInfo);
};

// 로그아웃
export const logout = (): void => {
  removeAuthToken();
  
  // 로그인 페이지로 리다이렉트 (브라우저 환경에서만)
  if (typeof window !== 'undefined') {
    window.location.href = '/admin/login';
  }
};

// 토큰 만료 확인 (간단한 버전)
export const isTokenExpired = (token: string): boolean => {
  try {
    // 테스트 토큰인 경우 만료되지 않은 것으로 처리
    if (token.startsWith('test_token_')) {
      return false;
    }
    
    // JWT 토큰의 payload 부분을 디코딩
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    return payload.exp < currentTime;
  } catch (error) {
    // 테스트 토큰이 아니고 토큰 형식이 잘못된 경우 만료된 것으로 처리
    if (token.startsWith('test_token_')) {
      return false;
    }
    return true;
  }
};

// 인증 상태 검증 (만료 체크 포함)
export const validateAuth = (): boolean => {
  const token = getAuthToken();
  
  if (!token) {
    return false;
  }
  
  if (isTokenExpired(token)) {
    // 만료된 토큰은 제거
    logout();
    return false;
  }
  
  return true;
};