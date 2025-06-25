import React from 'react';
import { useRouter } from 'next/router';

import styles from './ConfirmPayment.module.css';

const ConfirmPayment = () => {
  const router = useRouter();

  const handleClose = () => {
    router.push('/');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.paymentbox}>
        <div className={styles.textBox}>
          <p>예매가 완료되었습니다.</p>
          <button className={styles.closeButton} onClick={handleClose}>
            창닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPayment;
