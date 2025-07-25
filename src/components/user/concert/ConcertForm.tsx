// pages/concert/concert.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import ConcertCard from '@/components/user/concert/ConcertCard';
import Pagination from '@/components/user/common/Pagination';
import styles from './Concert.module.css';

type Concert = {
  id: number;
  title: string;
  singer: string;
  date: string;
};

// API 응답 타입
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const mockData: Concert[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  title: `title title title ${i + 1}`,
  singer: `singer ${i + 1}`,
  date: `2025-05-${(30 - (i % 30)).toString().padStart(2, '0')}`,
}));

export default function ConcertPage() {
  const router = useRouter();

  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  const perPage = 9;

  // 콘서트 데이터 불러오기
  const fetchConcerts = async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl =
        process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL || 'http://localhost:8080';

      const size = perPage;
      const token = localStorage.getItem('accessToken') || '';
      const url = `${apiUrl}/api/concert/main-list?size=${size}`;

      console.log('📦 [fetchConcerts] 호출됨');
      console.log('🌐 API URL:', url);
      console.log('📄 토큰:', token);
      console.log('🔢 페이지:', page);
      console.log('🔢 perPage:', perPage);

      const response = await fetch(url, {
        headers: {
          Accept: '*/*',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📥 응답 상태코드:', response.status);
      console.log('📥 응답 OK 여부:', response.ok);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<Concert[]> = await response.json();

      if (data.success) {
        setConcerts(data.data);
        setTotalPages(Math.ceil(data.data.length / perPage)); // 서버에서 전체 개수를 내려주면 그것 기준으로 수정
        console.log('✅ 콘서트 데이터 로드 성공:', data.data);
      } else {
        throw new Error(data.message || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ API 요청 실패, Mock 데이터 사용:', err);
      setUseMockData(true);

      const startIndex = (page - 1) * perPage;
      const endIndex = page * perPage;
      setConcerts(mockData.slice(startIndex, endIndex));
      setTotalPages(Math.ceil(mockData.length / perPage));
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConcerts(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRetry = () => {
    setUseMockData(false);
    setError(null);
    fetchConcerts(currentPage);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>콘서트</h1>

        <div className={styles.statusIndicator}>
          {loading && <span className={styles.loading}>🔄 로딩 중...</span>}
          {error && (
            <div className={styles.errorBanner}>
              <span className={styles.errorText}>
                ⚠️ API 연결 실패 - Mock 데이터 사용 중
              </span>
              <button onClick={handleRetry} className={styles.retryButton}>
                재시도
              </button>
            </div>
          )}
          {!loading && !error && !useMockData && (
            <span className={styles.success}>✅ API 연결됨</span>
          )}
        </div>
      </div>

      {/* 콘서트 리스트 */}
      {!loading && (
        <div className={styles.list}>
          {concerts.map((concert) => (
            <ConcertCard key={concert.id} concert={concert} />
          ))}
        </div>
      )}

      {!loading && concerts.length === 0 && (
        <div className={styles.emptyState}>
          <p>등록된 콘서트가 없습니다.</p>
        </div>
      )}

      {!loading && concerts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* 개발용 디버깅 정보 */}
      {process.env.NODE_ENV === 'development' && (
        <div className={styles.debugInfo}>
          <details>
            <summary>디버깅 정보</summary>
            <div className={styles.debugContent}>
              <p>
                <strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL}
                /api/concert/main-list
              </p>
              <p>
                <strong>현재 페이지:</strong> {currentPage}
              </p>
              <p>
                <strong>데이터 소스:</strong> {useMockData ? 'Mock 데이터' : 'API'}
              </p>
              <p>
                <strong>콘서트 수:</strong> {concerts.length}
              </p>
              <p>
                <strong>전체 페이지:</strong> {totalPages}
              </p>
              {error && (
                <p>
                  <strong>에러:</strong> {error}
                </p>
              )}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
