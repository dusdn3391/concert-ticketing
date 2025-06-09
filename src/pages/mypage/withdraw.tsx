import React from 'react';

import styles from './Withdraw.module.css';
import MypageNav from '@/components/user/MypageNav';

export default function WithDraw() {
  return (
    <div className={styles.all}>
      <div className={styles.margin}>
        <div>
          <h1 className={styles.title}>마이페이지</h1>
        </div>
        <div className={styles.container}>
          <MypageNav />
          <section className={styles.content}>
            <div className={styles.withdraw}>
              <div className={styles.withdrawTitle}>회원탈퇴</div>
              <div className={styles.wrapper}>
                <div className={styles.withdrawInfo}>
                  <p>회원탈퇴 약정들</p>
                </div>
                <div className={styles.withdrawButton}>
                  <button>회원탈퇴</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
