import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdminBadgeStore } from '@/stores/badges';

import { Concert } from '@/types/concert';
import { apiCall } from '@/lib/api';

import { ConcertCard } from './ConcertCard';
import styles from './concertList.module.css';

interface ConcertListProps {
  initialConcerts?: Concert[];
}

export default function ConcertList({ initialConcerts }: ConcertListProps = {}) {
  const [concerts, setConcerts] = useState<Concert[]>(initialConcerts || []);
  const [loading, setLoading] = useState<boolean>(!initialConcerts);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 👇 전역 setter
  const { setConcertCount } = useAdminBadgeStore();

  const fetchConcerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiCall('/api/concerts', { method: 'GET' });
      const list = Array.isArray(data) ? data : (data.content ?? data.data ?? []);

      setConcerts(list);
      setConcertCount(list.length); // 👈 여기서 뱃지 개수 업데이트
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '콘서트 목록을 불러오는데 실패했습니다.',
      );
      setConcertCount(0); // 실패 시 0으로
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialConcerts) {
      fetchConcerts();
    } else {
      // SSR/초기 prop으로 받은 경우도 반영
      setConcertCount(initialConcerts.length);
    }
  }, [initialConcerts]);

  const handleDeleteConcert = async (concertId: number, concertTitle: string) => {
    if (!window.confirm(`${concertTitle}을(를) 삭제하시겠습니까?`)) return;

    try {
      await apiCall(`/api/concerts/${concertId}`, { method: 'DELETE' });
      setConcerts((prev) => {
        const next = prev.filter((c) => c.id !== concertId);
        setConcertCount(next.length);
        return next;
      });
      alert(`${concertTitle}이(가) 삭제되었습니다.`);
    } catch (err) {
      alert('콘서트 삭제에 실패했습니다.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>🎵 내 콘서트</h1>
            <p className={styles.subtitle}>
              총 {concerts.length}개의 콘서트를 관리하고 있습니다
            </p>
          </div>

          <Link href='/admin/concerts/create' className={styles.createButton}>
            ➕ 새 콘서트 만들기
          </Link>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>⏳ 불러오는 중...</div>
      ) : error ? (
        <div className={styles.errorState}>
          <p>{error}</p>
          <button onClick={fetchConcerts}>다시 시도</button>
        </div>
      ) : concerts.length === 0 ? (
        <div className={styles.emptyState}>콘서트가 없습니다</div>
      ) : (
        <div
          className={`${styles.venueGrid} ${viewMode === 'list' ? styles.listMode : ''}`}
        >
          {concerts.map((concert) => (
            <ConcertCard
              key={concert.id}
              concert={concert}
              onDelete={handleDeleteConcert}
            />
          ))}
        </div>
      )}
    </div>
  );
}
