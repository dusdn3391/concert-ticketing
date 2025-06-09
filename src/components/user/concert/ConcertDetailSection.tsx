import React from 'react';
import Image from 'next/image';

import styles from '@/pages/concert/ConcertDetail.module.css';

export default function ConcertDetailSection() {
  return (
    <div className={styles.detailImage}>
      <Image src='/detail.jpg' alt='배너' />
    </div>
  );
}
