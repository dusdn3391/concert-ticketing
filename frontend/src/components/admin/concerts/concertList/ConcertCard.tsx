import React from 'react';
import Link from 'next/link';

import { Concert } from '@/types/concert';

import styles from './concertList.module.css';

interface ConcertCardProps {
  concert: Concert;
  onDelete: (concertId: number, concertTitle: string) => void;
}

export function ConcertCard({ concert, onDelete }: ConcertCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getDateStatus = () => {
    const now = new Date();
    const startDate = new Date(concert.startDate);
    const endDate = new Date(concert.endDate);

    if (now < startDate) {
      return { status: 'upcoming', text: '예정', color: '#3b82f6' };
    } else if (now >= startDate && now <= endDate) {
      return { status: 'ongoing', text: '진행중', color: '#10b981' };
    } else {
      return { status: 'ended', text: '종료', color: '#6b7280' };
    }
  };

  const dateStatus = getDateStatus();

  return (
    <div className={styles.venueCard}>
      {/* 상태 배지 */}
      <div className={styles.statusBadge} style={{ backgroundColor: dateStatus.color }}>
        {dateStatus.text}
      </div>

      {/* 기본 정보 */}
      <div className={styles.venueInfo}>
        <h3 className={styles.venueName}>{concert.title}</h3>
        <p className={styles.venueLocation}>📍 {concert.location}</p>
        <p className={styles.venueDescription}>{concert.description}</p>
      </div>

      {/* 통계 */}
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <div className={styles.statValue}>{formatDate(concert.startDate)}</div>
          <div className={styles.statLabel}>시작일</div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statValue}>{formatDate(concert.endDate)}</div>
          <div className={styles.statLabel}>종료일</div>
        </div>

        <div className={styles.statItem}>
          <div className={styles.statValue}>★ {concert.rating}</div>
          <div className={styles.statLabel}>평점</div>
        </div>
      </div>

      {/* 예약 기간 */}
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <div className={styles.statValue}>
            {formatDate(concert.reservationStartDate)}
          </div>
          <div className={styles.statLabel}>예매 시작</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statValue}>{formatDate(concert.reservationEndDate)}</div>
          <div className={styles.statLabel}>예매 종료</div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className={styles.actionButtons}>
        <Link
          href={`/admin/concerts/${concert.id}`}
          className={styles.editButton}
          style={{ backgroundColor: dateStatus.color }}
        >
          📝 편집
        </Link>

        <button
          onClick={() => onDelete(concert.id, concert.title)}
          className={styles.deleteButton}
          title='삭제'
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
