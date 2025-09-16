import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

import styles from './ConcertCard.module.css';

type Concert = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  rating: number;
  thumbNailImageUrl: string; // 토큰 포함된 절대/상대 URL
};

interface ConcertCardProps {
  concert: Concert;
  className?: string;
}

export default function ConcertCard({ concert, className }: ConcertCardProps) {
  const router = useRouter();
  const [fallback, setFallback] = useState(false);

  const handleClick = () => {
    router.push(`/concert/${concert.id}`);
  };

  // 썸네일 없거나 로드 실패 시 사용할 플레이스홀더
  const imgSrc =
    !fallback && concert.thumbNailImageUrl ? concert.thumbNailImageUrl : '/concerts.png';

  return (
    <div onClick={handleClick} className={`${styles.card} ${className ?? ''}`}>
      <div className={styles.image}>
        <Image
          src={imgSrc}
          alt={concert.title || 'thumbnail'}
          fill
          style={{ objectFit: 'cover' }}
          className={styles.concertImage}
          onError={() => setFallback(true)}
          unoptimized
          priority={false}
        />
      </div>
      <div className={styles.cardTitle}>{concert.title}</div>
      {/* 필요하면 날짜/장소/평점 노출 */}
      {
        <div className={styles.cardMeta}>
          <span>
            {concert.startDate} ~ {concert.endDate}
          </span>
          <span> {concert.location}</span>
        </div>
      }
    </div>
  );
}
