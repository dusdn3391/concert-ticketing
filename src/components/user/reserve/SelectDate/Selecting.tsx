// components/.../Selecting.tsx
import React, { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useDateStore } from '@/stores/dateStore';
import styles from './Selecting.module.css';

type Props = {
  startDate: string;
  endDate: string;
  totalSeatCount: number;
  schedules: Array<{ id: number; concertTime: string }>;
};

const toDate = (d: string) => new Date(d);
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n));
const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fmtHM = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

export default function SelectDate({
  startDate,
  endDate,
  totalSeatCount,
  schedules,
}: Props) {
  const {
    selectedDate,
    setSelectedDate,
    selectedScheduleId,
    setSelectedScheduleId, // ✅ 추가
  } = useDateStore();

  const [localSelectedScheduleId, setLocalSelectedScheduleId] = useState<number | null>(
    selectedScheduleId ?? null,
  );

  const allRounds = useMemo(
    () =>
      (schedules ?? [])
        .map((s) => ({ ...s, dt: new Date(s.concertTime) }))
        .sort((a, b) => a.dt.getTime() - b.dt.getTime()),
    [schedules],
  );

  const allowedDateKeys = useMemo(() => {
    const set = new Set<string>();
    for (const r of allRounds) set.add(fmtDate(r.dt));
    return set;
  }, [allRounds]);

  const minAllowedDate = useMemo(
    () => (allRounds.length ? allRounds[0].dt : undefined),
    [allRounds],
  );
  const maxAllowedDate = useMemo(
    () => (allRounds.length ? allRounds[allRounds.length - 1].dt : undefined),
    [allRounds],
  );

  const roundsForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    return allRounds.filter((r) => isSameDay(r.dt, selectedDate));
  }, [allRounds, selectedDate]);

  const groupedByDate = useMemo(() => {
    if (selectedDate) return null;
    const map = new Map<string, typeof allRounds>();
    for (const r of allRounds) {
      const key = fmtDate(r.dt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries()).sort(
      (a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime(),
    );
  }, [allRounds, selectedDate]);

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
                onChange={(value) => {
                  if (value instanceof Date) {
                    const key = fmtDate(value);
                    if (!allowedDateKeys.has(key)) {
                      setSelectedDate(null);
                      setSelectedScheduleId(null); // ✅ 날짜만 바꾸면 회차 초기화
                      setLocalSelectedScheduleId(null);
                      return;
                    }
                    setSelectedDate(value);
                  } else {
                    setSelectedDate(null);
                  }
                  setSelectedScheduleId(null); // ✅ 회차 초기화
                  setLocalSelectedScheduleId(null);
                }}
                value={selectedDate ?? null}
                locale='ko-KR'
                calendarType='gregory'
                tileDisabled={({ date, view }) =>
                  view === 'month' && !allowedDateKeys.has(fmtDate(date))
                }
                showNeighboringMonth={false}
                minDate={minAllowedDate ?? (startDate ? toDate(startDate) : undefined)}
                maxDate={maxAllowedDate ?? (endDate ? toDate(endDate) : undefined)}
              />
            </div>
          </div>
        </div>

        {/* 회차 선택 */}
        <div className={styles.center}>
          <div className={styles.selectTitle}>선택 2</div>
          <div className={styles.selectBox}>
            <div className={styles.selectName}>회차선택</div>

            {!selectedDate && groupedByDate && groupedByDate.length > 0 && (
              <div className={styles.roundsGroupList}>
                {groupedByDate.map(([dateKey, rounds]) => (
                  <div key={dateKey} className={styles.roundsGroup}>
                    <div className={styles.groupHeader}>{dateKey}</div>
                    <div className={styles.rounds}>
                      {rounds.map((r, idx) => {
                        const isActive = r.id === localSelectedScheduleId;
                        return (
                          <button
                            key={r.id}
                            type='button'
                            className={`${styles.roundItem} ${isActive ? styles.active : ''}`}
                            onClick={() => {
                              setLocalSelectedScheduleId(r.id);
                              setSelectedScheduleId(r.id); // ✅ store 저장
                              setSelectedDate(r.dt); // 날짜도 동기화
                            }}
                            aria-pressed={isActive}
                          >
                            <div className={styles.roundLabel}>{idx + 1}회차</div>
                            <div className={styles.time}>{fmtHM(r.dt)}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedDate && (
              <>
                {roundsForSelectedDay.length === 0 ? (
                  <div className={styles.roundsEmpty}>선택한 날짜의 회차가 없습니다.</div>
                ) : (
                  <div className={styles.rounds}>
                    {roundsForSelectedDay.map((r, idx) => {
                      const isActive = r.id === localSelectedScheduleId;
                      return (
                        <button
                          key={r.id}
                          type='button'
                          className={`${styles.roundItem} ${isActive ? styles.active : ''}`}
                          onClick={() => {
                            setLocalSelectedScheduleId(r.id);
                            setSelectedScheduleId(r.id); // ✅ store 저장
                            setSelectedDate(r.dt);
                          }}
                          aria-pressed={isActive}
                        >
                          <div className={styles.roundLabel}>{idx + 1}회차</div>
                          <div className={styles.time}>{fmtHM(r.dt)}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 좌석 정보 */}
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
            </div>
          </div>
        </div>
      </div>

      {/* 안내 */}
      <div className={styles.noticeBox}>
        <p className={styles.noticeTitle}>티켓 예매시 유의사항</p>
        <p className={styles.noticeContent}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>
      </div>
    </div>
  );
}
