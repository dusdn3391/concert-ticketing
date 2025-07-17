import React from 'react';
import Link from 'next/link';
import styles from './Nav.module.css';

const Nav = () => {
  return (
    <nav className={styles.nav}>
      <ul>
        <li>
          <Link href='/manager/banner'>배너 관리</Link>
        </li>
        <li>
          <Link href='/manager/notice'>공지사항</Link>
        </li>
        <li>
          <Link href='/manager/setting'>설정</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Nav;
