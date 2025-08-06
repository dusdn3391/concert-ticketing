import React from 'react';
import styles from './Modal.module.css';

export default function AdminSignupModal({ onClose }: { onClose: () => void }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>회원가입 완료</h2>
        <p>2~3일 후에 승인이 되어야 로그인이 가능합니다.</p>
        <button onClick={onClose}>확인</button>
      </div>
    </div>
  );
}
