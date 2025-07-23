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

// 페이지네이션 응답 타입
interface PaginationResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
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
  const [sortOption, setSortOption] = useState('latest');
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  const perPage = 9;

  // API에서 콘서트 데이터 가져오기
  const fetchConcerts = async (page: number, sort: string) => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl =
        process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL || 'http://localhost:8080';

      // API 파라미터 설정
      const params = new URLSearchParams({
        page: (page - 1).toString(), // 백엔드는 0부터 시작
        size: perPage.toString(),
        sort: sort === 'latest' ? 'date,desc' : 'id,asc',
      });

      const response = await fetch(`${apiUrl}/login`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<PaginationResponse<Concert>> = await response.json();

      if (data.success) {
        setConcerts(data.data.content);
        setTotalPages(data.data.totalPages);
        console.log('✅ 콘서트 데이터 로드 성공:', data.data);
      } else {
        throw new Error(data.message || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('❌ API 요청 실패, Mock 데이터 사용:', err);

      // API 실패 시 Mock 데이터 사용
      setUseMockData(true);
      const sortedMockData = [...mockData].sort((a, b) => {
        if (sort === 'latest') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } else {
          return a.id - b.id;
        }
      });

      const startIndex = (page - 1) * perPage;
      const endIndex = page * perPage;
      setConcerts(sortedMockData.slice(startIndex, endIndex));
      setTotalPages(Math.ceil(mockData.length / perPage));

      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 및 페이지/정렬 변경 시 데이터 로드
  useEffect(() => {
    fetchConcerts(currentPage, sortOption);
  }, [currentPage, sortOption]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRetry = () => {
    setUseMockData(false);
    setError(null);
    fetchConcerts(currentPage, sortOption);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>콘서트</h1>

        {/* API 상태 표시 */}
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

      <div className={styles.sortWrapper}>
        <select
          className={styles.sortSelect}
          value={sortOption}
          onChange={handleSortChange}
          aria-label='정렬 방식 선택'
          disabled={loading}
        >
          <option value='latest'>최신순</option>
          <option value='popular'>인기순</option>
        </select>
      </div>

      {/* 로딩 스피너 */}
      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>콘서트 데이터를 불러오는 중...</p>
        </div>
      )}

      {/* 콘서트 리스트 */}
      {!loading && (
        <div className={styles.list}>
          {concerts.map((concert) => (
            <ConcertCard key={concert.id} concert={concert} />
          ))}
        </div>
      )}

      {/* 데이터가 없을 때 */}
      {!loading && concerts.length === 0 && (
        <div className={styles.emptyState}>
          <p>등록된 콘서트가 없습니다.</p>
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && concerts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* 개발 모드에서만 표시되는 디버깅 정보 */}
      {process.env.NODE_ENV === 'development' && (
        <div className={styles.debugInfo}>
          <details>
            <summary>디버깅 정보</summary>
            <div className={styles.debugContent}>
              <p>
                <strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL}
                /api/concerts/map
              </p>
              <p>
                <strong>현재 페이지:</strong> {currentPage}
              </p>
              <p>
                <strong>정렬 옵션:</strong> {sortOption}
              </p>
              <p>
                <strong>데이터 소스:</strong> {useMockData ? 'Mock 데이터' : 'API'}
              </p>
              <p>
                <strong>로드된 콘서트 수:</strong> {concerts.length}
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
