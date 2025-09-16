// Header.tsx (핵심 로직만 차이 위주로)
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import styles from './Header.module.css';

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function Header() {
  const router = useRouter();
  const path = router.asPath;
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 예약된 자동 로그아웃 타이머를 취소하기 위해 ref에 저장
  const logoutTimerRef = useRef<number | null>(null);

  const doLogout = () => {
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    localStorage.removeItem('accessToken');
    setIsLoggedIn(false);
    router.push('/login');
  };

  const scheduleAutoLogout = (token: string) => {
    // payload.exp는 "초" 단위, Date.now()는 "ms" 단위
    const payload = parseJwt(token);
    if (!payload?.exp) return;

    const nowMs = Date.now();
    const expMs = payload.exp * 1000;
    const skewMs = 5_000; // 5초 여유(네트워크/클럭 스큐 대비)
    const delay = Math.max(expMs - nowMs - skewMs, 0);

    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    logoutTimerRef.current = window.setTimeout(() => {
      // 만료 시점 도달 → 자동 로그아웃
      doLogout();
    }, delay);
  };

  const checkTokenAndMaybeLogout = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoggedIn(false);
      return;
    }
    const payload = parseJwt(token);
    if (!payload?.exp) {
      // exp 없는 토큰은 신뢰하지 않고 제거
      doLogout();
      return;
    }
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp <= nowSec) {
      // 이미 만료
      doLogout();
      return;
    }
    // 유효 → 로그인 표시 & 자동 로그아웃 예약
    setIsLoggedIn(true);
    scheduleAutoLogout(token);
  };

  useEffect(() => {
    // 초기 체크
    checkTokenAndMaybeLogout();

    // 라우트 이동 때마다 재검증
    const onRoute = () => checkTokenAndMaybeLogout();
    router.events.on('routeChangeComplete', onRoute);

    // 주기적 재검증(예: 1분)
    const interval = window.setInterval(checkTokenAndMaybeLogout, 60_000);

    // 탭 비활성/재활성 간격 보완: 포커스 복귀시 재검증
    const onFocus = () => checkTokenAndMaybeLogout();
    window.addEventListener('focus', onFocus);

    return () => {
      router.events.off('routeChangeComplete', onRoute);
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      if (logoutTimerRef.current) window.clearTimeout(logoutTimerRef.current);
    };
  }, [router.events]);

  const handleLogout = () => doLogout();
  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.logoSearch}>
          <Link href='/'>concert-ticketing</Link>
          <div className={styles.searchBox}>
            <input type='text' placeholder='concert-ticketing' />
            <Link href='/search/result'>
              <button aria-label='검색'>
                <Image src='/search.png' alt='검색' width={20} height={20} />
              </button>
            </Link>
          </div>
        </div>
        <nav className={styles.navLinks}>
          {!isLoggedIn ? (
            <>
              <Link href='/login'>
                <div className={styles.navItem}>
                  <Image
                    src='/ico_header_login.png'
                    alt='로그인'
                    width={24}
                    height={24}
                  />
                  <span>로그인</span>
                </div>
              </Link>
              <Link href='/signup'>
                <div className={styles.navItem}>
                  <Image
                    src='/ico_header_signup.png'
                    alt='회원가입'
                    width={24}
                    height={24}
                  />
                  <span>회원가입</span>
                </div>
              </Link>
            </>
          ) : (
            <div
              className={styles.navItem}
              onClick={handleLogout}
              style={{ cursor: 'pointer' }}
            >
              <Image src='/login/logout.png' alt='로그아웃' width={24} height={24} />
              <span>로그아웃</span>
            </div>
          )}
          <Link href='/mypage'>
            <div className={styles.navItem}>
              <Image
                src='/ico_header_mypage.png'
                alt='마이페이지'
                width={24}
                height={24}
              />
              <span>마이페이지</span>
            </div>
          </Link>
          <Link href='/contact'>
            <div className={styles.navItem}>
              <Image src='/ico_header_call.png' alt='고객센터' width={24} height={24} />
              <span>고객센터</span>
            </div>
          </Link>
          {/* <Link href='/mypage/alarm'>
            <div className={styles.navItem}>
              <Image src='/alarm (1).png' alt='알림' width={24} height={24} />
              <span>알림</span>
            </div>
          </Link> */}
        </nav>
      </div>

      <div className={styles.menuBar}>
        <Link href='/' className={router.pathname === '/' ? styles.active : ''}>
          홈
        </Link>
        <Link
          href='/concert'
          className={path.startsWith('/concert') ? styles.active : ''}
        >
          콘서트
        </Link>
        <Link
          href='/region'
          className={router.pathname === '/region' ? styles.active : ''}
        >
          지역별
        </Link>
      </div>
    </header>
  );
}
