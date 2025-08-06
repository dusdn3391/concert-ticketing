import React from 'react';
import { useRouter } from 'next/router';
import styles from './Header.module.css';

const Header = () => {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin/login');
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>concert-ticketing</div>
      <div className={styles.rightMenu}>
        <span>홍길동님</span> |{' '}
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#0070f3',
          }}
        >
          로그아웃
        </button>
      </div>
    </header>
  );
};

export default Header;
