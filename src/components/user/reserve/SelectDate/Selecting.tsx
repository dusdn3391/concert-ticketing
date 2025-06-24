import React from 'react';

import styles from './Selecting.module.css';

const ConcertDate = () => {
  return (
    <div className={styles.leftPanel}>
      <div className={styles.layout}>
        <div className={styles.left}>
          <div className={styles.selectTitle}>선택 1</div>
          <div className={styles.selectBox}>
            <div className={styles.selectName}>날짜선택</div>
            <div className={styles.calendar}> 캘린더</div>
          </div>
        </div>
        <div className={styles.center}>
          <div className={styles.selectTitle}>선택 2</div>
          <div className={styles.selectBox}>
            <div className={styles.selectName}>회차선택</div>
            <div className={styles.rounds}>
              <div className={styles.round}>1회차</div>
              <div className={styles.time}>00시 00분</div>
            </div>
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.selectTitle}>선택 3</div>
          <div className={styles.selectBox}>
            <div className={styles.selectName}>잔여석</div>
            <div className={styles.seatAll}>
              <div className={styles.seats}>
                <div className={styles.seatType}>전체</div>
                <div className={styles.restSeat}>
                  120<p>석</p>
                </div>
              </div>
              <div className={styles.seats}>
                <div className={styles.seatType}>전체</div>
                <div className={styles.restSeat}>
                  120<p>석</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.noticeBox}>
        <p className={styles.noticeTitle}>티켓 예매시 유의사항</p>
        <p className={styles.noticeContent}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>
      </div>
    </div>
  );
};

export default ConcertDate;
