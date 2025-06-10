import React from 'react';
import Link from 'next/link';

import styles from './MypageNav.module.css';

export default function MypageNav() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.mypage}>
        <p className={styles.welcome}>안녕하세요 최*우님</p>
        <Link href='/mypage'>
          <p>concert-ticketing</p>
        </Link>
      </div>
      <div className={styles.menu}>
        <div>
          <h3>예매관리</h3>
          <Link href='/mypage/ticketing'>
            <p>예매확인 / 취소</p>
          </Link>
        </div>
        <div>
          <h3>활동관리</h3>
          <Link href='/mypage/review'>
            <p>후기관리</p>
          </Link>
          <Link href='/mypage/alarm'>
            <p>알림</p>
          </Link>
        </div>
        <div>
          <h3>회원정보관리</h3>
          <Link href='/mypage/myinfo'>
            <p>내정보</p>
          </Link>
          <Link href='/mypage/inquiry'>
            <p>1:1 문의 내역</p>
          </Link>
          <Link href='/mypage/withdraw'>
            <p>회원탈퇴</p>
          </Link>
        </div>
      </div>
    </aside>
  );
}
