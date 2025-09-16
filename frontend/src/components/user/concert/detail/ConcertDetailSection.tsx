import React from 'react';
import Image from 'next/image';

import styles from './ConcertDetail.module.css';

interface ConcertDetailSectionProps {
  descriptionImages?: string[];
}

export default function ConcertDetailSection({
  descriptionImages = [],
}: ConcertDetailSectionProps) {
  if (descriptionImages.length === 0) {
    return <div>상세 이미지를 준비 중입니다.</div>;
  }

  return (
    <div className={styles.detailImage}>
      {descriptionImages.map((img, idx) => (
        <div key={idx} className={styles.detailImage}>
          <Image
            src={img}
            alt={`상세 이미지 ${idx + 1}`}
            layout='responsive'
            width={800}
            height={400}
            className={styles.bannerImage}
            unoptimized
          />
        </div>
      ))}
    </div>
  );
}
