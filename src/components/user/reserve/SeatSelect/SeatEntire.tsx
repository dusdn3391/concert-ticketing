import React from 'react';

import styles from './SeatEntire.module.css';

const SeatEntire = () => {
  return (
    <div className={styles.leftPanel}>
      <div className={styles.concertTitle}>title title title title</div>
      <div className={styles.concertInfo}>
        <div className={styles.cocertVenue}>
          올림픽 공연장
          <div className={styles.line} />
          <div className={styles.date}>2025.05.01</div>
        </div>
      </div>
      <div className={styles.seats}>콘서트 배치도</div>
    </div>
  );
};

export default SeatEntire;
