import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from './zoneList.module.css';
import { useConcertStore } from '@/stores/concert';

interface ApiSeatSection {
  id: number;
  sectionName: string;
  colorCode: string;
  price: number;
  seats: Array<{
    id: number;
    rowName: string;
    seatNumber: string;
    price?: string | number;
  }>;
}

interface Zone {
  id: string;
  sectionId: number;
  colorCode: string;
  name: string;
  svgElementId: string;
  seatCount: number;
  price: number;
  status: 'draft' | 'completed' | 'published';
  lastModified: string;
}

interface ZoneListProps {
  concertId: string;
}

export default function ZoneList({ concertId }: ZoneListProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'seatCount' | 'lastModified'>('name');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'draft' | 'completed' | 'published'
  >('all');

  const fetchConcert = useConcertStore((s) => s.fetchConcert);
  const concert = useConcertStore((s) => s.get(concertId));
  const isLoading = useConcertStore((s) => s.isLoading(concertId));
  const error = useConcertStore((s) => s.getError(concertId));

  // ✅ 1) 초기 스냅샷
  useEffect(() => {
    const state = useConcertStore.getState();
    console.groupCollapsed('[ZoneList] 초기 ConcertStore 스냅샷');
    console.log('concertId:', concertId);
    console.log('byId:', state.byId);
    console.log('loadingById:', state.loadingById);
    console.log('errorById:', state.errorById);
    console.groupEnd();
  }, [concertId]);

  // ✅ 3) fetch 트리거 로그
  useEffect(() => {
    if (!concert && !isLoading) {
      console.groupCollapsed('[ZoneList] fetchConcert 트리거');
      console.log('concertId:', concertId);
      console.groupEnd();
      fetchConcert(concertId);
    }
  }, [concertId, concert, isLoading, fetchConcert]);

  // ✅ 4) 매핑 전 원본/매핑 결과 로그
  useEffect(() => {
    if (!concert) return;

    console.groupCollapsed('[ZoneList] concert 원본 데이터');
    console.log(concert);
    console.groupEnd();

    const seatSections: ApiSeatSection[] = Array.isArray(concert.seatSections)
      ? concert.seatSections
      : [];

    console.groupCollapsed('[ZoneList] seatSections 원본');
    console.table(
      seatSections.map((s) => ({
        id: s.id,
        sectionName: s.sectionName,
        colorCode: s.colorCode,
        price: s.price,
        seatsLen: Array.isArray(s.seats) ? s.seats.length : 0,
      })),
    );
    console.groupEnd();

    const updatedAt =
      (concert as any)?.updated_at ??
      concert?.updatedAt ??
      new Date().toISOString().slice(0, 10);

    const mapped: Zone[] = seatSections.map((s) => {
      const zoneId = `zone_${String(s.colorCode || s.id)}`;
      return {
        id: zoneId,
        sectionId: s.id,
        colorCode: String(s.colorCode || ''),
        name: s.sectionName ?? `구역`,
        svgElementId: zoneId,
        seatCount: Array.isArray(s.seats)
          ? s.seats.filter((x) => String(x.seatNumber).trim() !== '').length
          : 0,
        price: Number(s.price ?? 0),
        status: 'completed',
        lastModified: String(updatedAt).slice(0, 10),
      };
    });

    console.groupCollapsed('[ZoneList] 매핑 결과 zones');
    console.table(
      mapped.map((z) => ({
        id: z.id,
        sectionId: z.sectionId,
        colorCode: z.colorCode,
        name: z.name,
        seatCount: z.seatCount,
        price: z.price,
        status: z.status,
        lastModified: z.lastModified,
      })),
    );
    console.groupEnd();

    setZones(mapped);
  }, [concert]);

  const getStatusColor = (status: Zone['status']) => {
    switch (status) {
      case 'draft':
        return styles.statusDraft;
      case 'completed':
        return styles.statusCompleted;
      case 'published':
        return styles.statusPublished;
      default:
        return '';
    }
  };

  const getStatusText = (status: Zone['status']) => {
    switch (status) {
      case 'draft':
        return '작업중';
      case 'completed':
        return '완료';
      case 'published':
        return '발행됨';
      default:
        return status;
    }
  };

  const sortedAndFilteredZones = useMemo(() => {
    const filtered = zones.filter(
      (zone) => filterStatus === 'all' || zone.status === filterStatus,
    );
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'seatCount':
          return b.seatCount - a.seatCount;
        case 'lastModified':
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
        default:
          return 0;
      }
    });
  }, [zones, filterStatus, sortBy]);

  if (isLoading || !concert) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>구역 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.group('[ZoneList] 에러 상태');
    console.log('concertId:', concertId);
    console.error(error);
    console.groupEnd();

    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>❌</div>
          <h3>오류가 발생했습니다</h3>
          <p>{error}</p>
          <div className={styles.errorActions}>
            <button onClick={() => location.reload()} className={styles.retryButton}>
              다시 시도
            </button>
            <Link href={`/admin/concerts/${concertId}`} className={styles.backButton}>
              콘서트로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href={`/admin/concerts/${concertId}`} className={styles.backButton}>
            ← 콘서트로 돌아가기
          </Link>
          <div>
            <h1 className={styles.title}>구역 관리</h1>
            <p className={styles.subtitle}>총 {zones.length}개 구역</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Link
            href={`/admin/concerts/${concertId}/preview`}
            className={styles.previewButton}
          >
            전체 미리보기
          </Link>
        </div>
      </div>

      {/* 필터 및 정렬 */}
      <div className={styles.controls}>
        <div className={styles.filters}>
          <select
            title='status'
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className={styles.select}
          >
            <option value='all'>전체 상태</option>
            <option value='draft'>작업중</option>
            <option value='completed'>완료</option>
            <option value='published'>발행됨</option>
          </select>

          <select
            title='sortBy'
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={styles.select}
          >
            <option value='name'>이름순</option>
            <option value='seatCount'>좌석수순</option>
            <option value='lastModified'>수정일순</option>
          </select>
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {zones.filter((z) => z.status === 'published').length}
            </span>
            <span className={styles.statLabel}>발행</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {zones.filter((z) => z.status === 'completed').length}
            </span>
            <span className={styles.statLabel}>완료</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>
              {zones.filter((z) => z.status === 'draft').length}
            </span>
            <span className={styles.statLabel}>작업중</span>
          </div>
        </div>
      </div>

      {/* 구역 목록 */}
      <div className={styles.zoneGrid}>
        {sortedAndFilteredZones.map((zone) => (
          <div key={zone.colorCode} className={styles.zoneCard}>
            <div className={styles.zoneHeader}>
              <h3 className={styles.zoneName}>{zone.name}</h3>
              <span className={`${styles.status} ${getStatusColor(zone.status)}`}>
                {getStatusText(zone.status)}
              </span>
            </div>

            <div className={styles.zoneStats}>
              <div className={styles.zoneStat}>
                <span className={styles.statLabel}>좌석 수</span>
                <span className={styles.statValue}>{zone.seatCount}석</span>
              </div>
              <div className={styles.zoneStat}>
                <span className={styles.statLabel}>가격</span>
                <span className={styles.statValue}>{zone.price.toLocaleString()}원</span>
              </div>
              <div className={styles.zoneStat}>
                <span className={styles.statLabel}>수정일</span>
                <span className={styles.statValue}>{zone.lastModified}</span>
              </div>
            </div>

            <div className={styles.zoneActions}>
              <Link
                href={`/admin/concerts/${concertId}/zones/${zone.colorCode}`}
                className={styles.detailButton}
              >
                상세보기
              </Link>
              <Link
                href={`/admin/concerts/${concertId}/zones/${zone.colorCode}/editor`}
                className={styles.editButton}
              >
                좌석 편집
              </Link>
            </div>
          </div>
        ))}
      </div>

      {sortedAndFilteredZones.length === 0 && (
        <div className={styles.emptyState}>
          <p>조건에 맞는 구역이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
