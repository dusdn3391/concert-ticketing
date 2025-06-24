import React from 'react';
import { useRouter } from 'next/router';

import styles from './ProgressNav.module.css';

const steps = [
  { id: 'select-date', label: '날짜 / 회차선택' },
  { id: 'select-seat', label: '등급 / 좌석선택' },
  { id: 'confirm-ticket', label: '배송 선택 / 예매확인' },
  { id: 'payment', label: '결제' },
];

const ProgressNav = () => {
  const router = useRouter();
  const currentPath = router.pathname;

  const activeIndex = steps.findIndex((step) => currentPath.includes(step.id));

  return (
    <div className={styles.wrapper}>
      <div className={styles.logo}>concert-ticketing</div>
      <div className={styles.navContainer}>
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`${styles.step} ${index === activeIndex ? styles.active : ''}`}
          >
            {step.label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressNav;
