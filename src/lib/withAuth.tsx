import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { validateAuth, isAuthenticated } from './auth';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// 로딩 컴포넌트
const AuthLoadingComponent = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)',
      flexDirection: 'column',
      gap: '16px',
    }}
  >
    <div
      style={{
        width: '40px',
        height: '40px',
        border: '4px solid rgba(102, 126, 234, 0.2)',
        borderTop: '4px solid #667eea',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
    />
    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>인증 확인 중...</p>
    <style jsx>{`
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `}</style>
  </div>
);

// 인증이 필요한 페이지를 감싸는 래퍼 컴포넌트
export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      // 로그인 페이지는 인증 검사 스킵
      if (router.pathname === '/admin/login') {
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      // 인증 상태 확인
      const isValid = validateAuth();

      if (isValid) {
        setIsAuthorized(true);
      } else {
        // 인증 실패 시 로그인 페이지로 리다이렉트
        router.replace('/admin/login');
      }

      setIsLoading(false);
    };

    // router가 준비된 후 인증 확인
    if (router.isReady) {
      checkAuth();
    }
  }, [router.isReady, router.pathname]);

  // 로딩 중
  if (isLoading) {
    return <AuthLoadingComponent />;
  }

  // 인증되지 않은 경우 (리다이렉트 중)
  if (!isAuthorized) {
    return <AuthLoadingComponent />;
  }

  // 인증된 경우 원래 컴포넌트 렌더링
  return <>{children}</>;
};

// 고차 컴포넌트 (HOC) - 페이지 컴포넌트를 인증 래퍼로 감싸기
export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
): React.FC<P> => {
  const AuthenticatedComponent: React.FC<P> = (props) => {
    return (
      <AuthWrapper>
        <WrappedComponent {...props} />
      </AuthWrapper>
    );
  };

  // 디스플레이 이름 설정 (디버깅용)
  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthenticatedComponent;
};

// 관리자 페이지용 withAdminLayout 함수도 인증 기능 추가
export const withAuthAndAdminLayout = (options: { title: string }) => {
  return <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const AuthAndLayoutComponent: React.FC<P> = (props) => {
      return (
        <AuthWrapper>
          <WrappedComponent {...props} />
        </AuthWrapper>
      );
    };

    AuthAndLayoutComponent.displayName = `withAuthAndAdminLayout(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return AuthAndLayoutComponent;
  };
};
