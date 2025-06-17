import React from 'react';
import Image from 'next/image';

import styles from './ConcertDetail.module.css';

export default function ConcertDetailSection() {
  return (
    <div className={styles.detailImage}>
      <div className={styles.detailImage}>
        <Image
          src='/detail.jpg'
          alt='배너'
          layout='responsive'
          width={800}
          height={400}
          className={styles.bannerImage}
        />
      </div>
    </div>
  );
}
