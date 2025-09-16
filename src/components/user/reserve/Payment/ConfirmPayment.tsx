import React from 'react';
import { useRouter } from 'next/router';
import styles from './ConfirmPayment.module.css';

type Props = {
  concertTitle?: string;
  message?: string;
  onClose?: () => void;
  showButtons?: boolean;
};

const ConfirmPayment: React.FC<Props> = ({
  concertTitle,
  message = '예매가 완료되었습니다.',
  onClose,
  showButtons = true,
}) => {
  const router = useRouter();
  const handleClose = () => {
    if (onClose) return onClose();
    router.push('/');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.paymentbox}>
        <div className={styles.textBox}>
          <p>{message}</p>
          {concertTitle && <p className={styles.subText}>공연명: {concertTitle}</p>}
          {showButtons ? (
            <div className={styles.buttonsRow}>
              <button onClick={() => router.push('/mypage/ticketing')}>
                예매내역 보기
              </button>
              <button className={styles.closeButton} onClick={handleClose}>
                창닫기
              </button>
            </div>
          ) : (
            <button className={styles.closeButton} onClick={handleClose}>
              창닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmPayment;
