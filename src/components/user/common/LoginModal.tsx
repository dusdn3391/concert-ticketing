import React from 'react';
import styles from './LoginModal.module.css';

interface LoginModalProps {
  onClose: () => void;
}

export default function LoginModal({ onClose }: LoginModalProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <p>로그인을 해주세요.</p>
        <button className={styles.closeButton} onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
