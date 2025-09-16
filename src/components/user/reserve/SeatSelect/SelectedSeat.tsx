import styles from './SelectedSeat.module.css';

interface SelectedSeatProps {
  onPrev: () => void;
  onNext: () => void;
}

const SelectedSeat = ({ onPrev, onNext }: SelectedSeatProps) => {
  return (
    <div className={styles.rightPanel}>
      <div className={styles.selectGrade}>
        <div className={styles.selectGradePreview}>
          <div className={styles.map}>map</div>

          <div className={styles.gradeHeader}>
            <span>등급선택</span>
            <button className={styles.resetButton}>초기화</button>
          </div>
          <hr className={styles.divider} />

          <div className={styles.gradeList}>
            <p>S석</p>
            <p>R석</p>
          </div>
        </div>

        <div className={styles.divide}>
          <div className={styles.notice}>최대 2매까지 예매가 가능합니다.</div>
        </div>
      </div>
      <div className={styles.buttonGroup}>
        <button className={styles.prevButton} onClick={onPrev}>
          이전단계
        </button>
        <button className={styles.nextButton} onClick={onNext}>
          다음단계
        </button>
      </div>
    </div>
  );
};

export default SelectedSeat;
