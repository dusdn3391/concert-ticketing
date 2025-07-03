import React from 'react';

import styles from './Section.module.css';

export default function LocationInfoSection() {
  return (
    <div className={styles.wrap}>
      <h3>장소 정보</h3>
      <p>서울 송파구 올림픽로 25, 올림픽공원 내 올림픽홀</p>
      <iframe
        src='https://www.google.com/maps/embed?...'
        width='100%'
        height='300'
        title='지도'
        style={{ border: 0 }}
        allowFullScreen
        loading='lazy'
        referrerPolicy='no-referrer-when-downgrade'
      />
    </div>
  );
}
