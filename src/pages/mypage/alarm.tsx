import React, { useState } from "react";
import styles from "./Alarm.module.css";
import MypageNav from "../../components/user/components/MypageNav";
import Pagination from "@/components/user/components/Pagination";
import AlarmModal from "./AlarmModal";

export default function Alarm() {
  const totalAlarms = 13;

  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${
    today.getMonth() + 1
  }월 ${today.getDate()}일`;

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlarm, setSelectedAlarm] = useState<null | {
    id: number;
    title: string;
    content: string;
    date: string;
  }>(null);

  const alarmsPerPage = 5;

  // ✅ 가데이터: id, title, content, date 포함
  const alarmData = Array.from({ length: totalAlarms }, (_, i) => ({
    id: i + 1,
    title: `알림 제목 ${i + 1}`,
    content: `이것은 ${
      i + 1
    }번째 알림의 본문입니다. 공연 일정 변경 또는 티켓 안내 내용 등이 들어갈 수 있습니다.`,
    date: `2025-05-${String((i % 31) + 1).padStart(2, "0")}`,
  }));

  const indexOfLastAlarm = currentPage * alarmsPerPage;
  const indexOfFirstAlarm = indexOfLastAlarm - alarmsPerPage;
  const currentAlarms = alarmData.slice(indexOfFirstAlarm, indexOfLastAlarm);

  const totalPages = Math.ceil(alarmData.length / alarmsPerPage);

  const openModal = (alarm: (typeof alarmData)[0]) => {
    setSelectedAlarm(alarm);
  };

  const closeModal = () => {
    setSelectedAlarm(null);
  };

  return (
    <div className={styles.all}>
      <div className={styles.margin}>
        <div>
          <h1 className={styles.title}>마이페이지</h1>
        </div>
        <div className={styles.container}>
          <MypageNav />
          <section className={styles.content}>
            <div className={styles.review}>
              <div className={styles.reviewTitle}>알림</div>

              <div className={styles.reviewTableBox}>
                <table className={styles.reviewTable}>
                  <tbody>
                    {currentAlarms.map((alarm) => (
                      <tr
                        key={alarm.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => openModal(alarm)}
                      >
                        <td>{alarm.title}</td>
                        <td>{alarm.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </section>
        </div>
      </div>

      {/* 모달 컴포넌트 */}
      {selectedAlarm && (
        <AlarmModal
          isOpen={!!selectedAlarm}
          alarm={selectedAlarm}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
