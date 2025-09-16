import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import styles from './ContactNav.module.css';

interface CustomerSidebarProps {
  activeMenu?: string;
}

const faqItems = [
  { label: '배송', slug: 'delivery' },
  { label: '상품', slug: 'product' },
  { label: '취소', slug: 'cancel' },
  { label: '결제/환불', slug: 'payment' },
  { label: '기타', slug: 'etc' },
];

const CustomerSidebar: React.FC<CustomerSidebarProps> = ({ activeMenu = '' }) => {
  const router = useRouter();

  const isNoticePage = router.pathname.startsWith('/contact/notice');

  return (
    <div className={styles.sidebar}>
      <h2 className={styles.sidebarTitle}>고객센터</h2>

      <div className={styles.sidebarSection}>
        <h3 className={styles.sidebarSectionTitle}>FAQ</h3>
        <ul className={styles.sidebarList}>
          {faqItems.map(({ label, slug }) => (
            <li key={slug} className={activeMenu === slug ? styles.active : ''}>
              <Link href={`/contact/faq/${slug}`}>{label}</Link>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.sidebarSection}>
        <h3 className={styles.sidebarSectionTitle}>1:1 문의</h3>
        <ul className={styles.sidebarList}>
          <li className={activeMenu === 'inquiry' ? styles.active : ''}>
            <Link href='/contact/write'>1:1 문의하기</Link>
          </li>
        </ul>
      </div>

      <div className={styles.sidebarSection}>
        <div
          className={`${styles.sidebarLink} ${activeMenu === 'notice' ? styles.active : ''}`}
        >
          <Link href='/contact/notice'>
            공지사항 <span>&gt;</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerSidebar;
