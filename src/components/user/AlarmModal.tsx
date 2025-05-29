import React from "react";
import styles from "./AlarmModal.module.css";

type AlarmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  alarm: {
    id: number;
    title: string;
    content: string;
    date: string;
  } | null;
};

export default function AlarmModal({
  isOpen,
  onClose,
  alarm,
}: AlarmModalProps) {
  if (!isOpen || !alarm) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.modalTitle}>{alarm.title}</h2>
        <p className={styles.modalDate}>{alarm.date}</p>
        <div className={styles.modalContent}>{alarm.content}</div>
        <button className={styles.modalCloseButton} onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
