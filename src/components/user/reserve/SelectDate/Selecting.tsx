import React from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useDateStore } from '@/stores/dateStore';

import styles from './Selecting.module.css';

type Props = {
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  totalSeatCount: number; // 전체 좌석 수 (seatSections[*].seats 합계)
};

const toDate = (d: string) => new Date(d);

const SelectDate: React.FC<Props> = ({ startDate, endDate, totalSeatCount }) => {
  const { selectedDate, setSelectedDate } = useDateStore();

  return (
    <div className={styles.leftPanel}>
      <div className={styles.layout}>
        {/* 날짜 선택 */}
        <div className={styles.left}>
          <div className={styles.selectTitle}>선택 1</div>
          <div className={styles.selectBox}>
            <div className={styles.selectName}>날짜선택</div>
            <div className={styles.calendar}>
              <Calendar
                className={styles.calendarRoot}
                onChange={(date) => setSelectedDate(date as Date)}
                value={selectedDate}
                locale='ko-KR'
                calendarType='gregory'
                minDate={toDate(startDate)}
                maxDate={toDate(endDate)}
              />
            </div>
          </div>
        </div>

        {/* 회차 선택 - 임시 고정 (필요 시 나중에 실제 스케줄로 교체) */}
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

        {/* 좌석 정보 - 전체 좌석 수 표시 */}
        <div className={styles.right}>
          <div className={styles.selectTitle}>선택 3</div>
          <div className={styles.selectBox}>
            <div className={styles.selectName}>잔여석</div>
            <div className={styles.seatAll}>
              <div className={styles.seats}>
                <div className={styles.seatType}>전체</div>
                <div className={styles.restSeat}>
                  {totalSeatCount.toLocaleString()}
                  <p>석</p>
                </div>
              </div>
              {/* 필요하면 등급/구역별로 추가 섹션 구성 가능 */}
            </div>
          </div>
        </div>
      </div>

      {/* 안내 문구 */}
      <div className={styles.noticeBox}>
        <p className={styles.noticeTitle}>티켓 예매시 유의사항</p>
        <p className={styles.noticeContent}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>
      </div>
    </div>
  );
};

export default SelectDate;
