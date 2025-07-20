import React, { useState } from 'react';
import Link from 'next/link';

import { Concert } from '@/types/concert';

import { ConcertCard } from './ConcertCard';
import styles from './concertList.module.css';

interface ConcertListProps {
  initialConcerts?: Concert[];
}

interface FilterOptions {
  sortBy: 'title' | 'created_at' | 'start_date' | 'rating';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
}

// 목업 데이터를 별도 함수로 분리
const getInitialConcerts = (): Concert[] => [
  {
    id: 1,
    title: 'IU 2024 콘서트 [HEREH]',
    description: '아이유의 2024년 전국 투어 콘서트',
    location: '서울 잠실 종합운동장 주경기장',
    location_X: 127.0719,
    location_y: 37.513,
    start_date: '2024-08-17',
    end_date: '2024-08-18',
    rating: 4.8,
    admin_id: 1,
    created_at: '2024-03-15T09:00:00Z',
    updated_at: '2024-06-05T14:30:00Z',
  },
  {
    id: 2,
    title: 'NewJeans Get Up Tour',
    description: '뉴진스의 첫 번째 월드투어',
    location: 'KSPO DOME',
    location_X: 127.0748,
    location_y: 37.5145,
    start_date: '2024-09-01',
    end_date: '2024-09-03',
    rating: 4.9,
    admin_id: 1,
    created_at: '2024-04-20T10:00:00Z',
    updated_at: '2024-06-01T09:15:00Z',
  },
  {
    id: 3,
    title: 'BTS 월드투어 서울 앙코르',
    description: 'BTS의 월드투어 서울 앙코르 공연',
    location: '서울 잠실 올림픽 주경기장',
    location_X: 127.0719,
    location_y: 37.513,
    start_date: '2024-10-15',
    end_date: '2024-10-22',
    rating: 5.0,
    admin_id: 1,
    created_at: '2024-05-10T11:00:00Z',
    updated_at: '2024-05-25T16:45:00Z',
  },
  {
    id: 4,
    title: 'LE SSERAFIM 팬미팅',
    description: '르세라핌의 2024 팬미팅',
    location: '부산 BEXCO 오디토리움',
    location_X: 129.1364,
    location_y: 35.169,
    start_date: '2024-07-28',
    end_date: '2024-07-28',
    rating: 4.6,
    admin_id: 1,
    created_at: '2024-02-05T08:00:00Z',
    updated_at: '2024-04-10T11:20:00Z',
  },
];

export default function ConcertList({ initialConcerts }: ConcertListProps = {}) {
  const [concerts, setConcerts] = useState<Concert[]>(
    initialConcerts || getInitialConcerts(),
  );

  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'created_at',
    sortOrder: 'desc',
    searchQuery: '',
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 필터링 및 정렬된 concert 목록
  const filteredConcerts = concerts
    .filter((concert) => {
      // 검색 필터
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        return (
          concert.title.toLowerCase().includes(query) ||
          concert.location.toLowerCase().includes(query) ||
          concert.description.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      const order = filters.sortOrder === 'asc' ? 1 : -1;

      switch (filters.sortBy) {
        case 'title':
          return a.title.localeCompare(b.title) * order;
        case 'created_at':
          return (
            (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * order
          );
        case 'start_date':
          return (
            (new Date(a.start_date).getTime() - new Date(b.start_date).getTime()) * order
          );
        case 'rating':
          return (a.rating - b.rating) * order;
        default:
          return 0;
      }
    });

  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K],
  ): void => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleDeleteConcert = (concertId: number, concertTitle: string): void => {
    if (
      window.confirm(
        `${concertTitle}을(를) 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      )
    ) {
      setConcerts(concerts.filter((concert) => concert.id !== concertId));
    }
  };

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>🎵 내 콘서트</h1>
            <p className={styles.subtitle}>
              총 {filteredConcerts.length}개의 콘서트를 관리하고 있습니다
            </p>
          </div>

          <Link href='/admin/concerts/create' className={styles.createButton}>
            ➕ 새 콘서트 만들기
          </Link>
        </div>

        {/* 필터 및 검색 */}
        <div className={styles.filterGrid}>
          {/* 정렬 */}
          <select
            value={filters.sortBy}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              updateFilter('sortBy', e.target.value as FilterOptions['sortBy'])
            }
            className={styles.filterSelect}
          >
            <option value='created_at'>생성순</option>
            <option value='start_date'>공연일순</option>
            <option value='title'>제목순</option>
            <option value='rating'>평점순</option>
          </select>

          {/* 정렬 방향 */}
          <button
            onClick={() =>
              updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')
            }
            className={styles.sortButton}
            title={`${filters.sortOrder === 'asc' ? '오름차순' : '내림차순'}`}
          >
            {filters.sortOrder === 'asc' ? '⬆️' : '⬇️'}
          </button>

          {/* 검색 */}
          <input
            type='text'
            placeholder='콘서트 제목, 위치, 설명으로 검색...'
            value={filters.searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              updateFilter('searchQuery', e.target.value)
            }
            className={styles.searchInput}
          />

          {/* 보기 모드 */}
          <div className={styles.viewModeButtons}>
            <button
              onClick={() => setViewMode('grid')}
              className={`${styles.viewModeButton} ${viewMode === 'grid' ? styles.active : ''}`}
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`${styles.viewModeButton} ${viewMode === 'list' ? styles.active : ''}`}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* 콘서트 목록 */}
      {filteredConcerts.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎵</div>
          <h3 className={styles.emptyTitle}>
            {filters.searchQuery
              ? '검색 조건에 맞는 콘서트가 없습니다'
              : '아직 콘서트가 없습니다'}
          </h3>
          <p className={styles.emptyDescription}>
            {filters.searchQuery
              ? '다른 검색 조건을 시도해보세요.'
              : '첫 번째 콘서트를 만들어서 시작해보세요.'}
          </p>
          {!filters.searchQuery && (
            <Link href='/admin/concerts/create' className={styles.emptyCreateButton}>
              첫 콘서트 만들기
            </Link>
          )}
        </div>
      ) : (
        <div
          className={`${styles.venueGrid} ${viewMode === 'list' ? styles.listMode : ''}`}
        >
          {filteredConcerts.map((concert) => (
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
