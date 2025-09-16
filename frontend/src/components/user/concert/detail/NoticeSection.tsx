import React from 'react';

import styles from './Section.module.css';

export default function NoticeSection() {
  return (
    <div className={styles.wrap}>
      <div className={styles.cancelWrap}>
        <h3>예매 / 취소 안내</h3>
        <div className={styles.cancelBox}>
          <ul>
            <li>예매 후 7일 이내 취소 시 전액 환불 가능합니다.</li>
            <li>공연일 기준 3일 전부터는 취소 수수료가 발생합니다.</li>
            <li>공연 당일 취소 및 환불은 불가합니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
