import React, { useState } from 'react';
import { useRouter } from 'next/router';

import CustomerSidebar from '@/components/user/contact/ContactNav';
import Pagination from '@/components/user/common/Pagination';
import styles from './NoticeForm.module.css';

const NoticePage = () => {
  const router = useRouter();
  const totalNotices = 13;

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNotice, setSelectedNotice] = useState<null | {
    id: number;
    title: string;
    content: string;
    date: string;
  }>(null);

  const noticesPerPage = 5;
  const noticeData = Array.from({ length: totalNotices }, (_, i) => ({
    id: i + 1,
    title: `공지사항 제목 ${i + 1}`,
    content: `이것은 ${i + 1}번째 공지사항의 본문입니다. 공연 일정 변경 또는 티켓 안내 내용 등이 들어갈 수 있습니다.`,
    date: `2025-05-${String((i % 31) + 1).padStart(2, '0')}`,
  }));

  const indexOfLastNotice = currentPage * noticesPerPage;
  const indexOfFirstNotice = indexOfLastNotice - noticesPerPage;
  const currentNotices = noticeData.slice(indexOfFirstNotice, indexOfLastNotice);

  const totalPages = Math.ceil(noticeData.length / noticesPerPage);

  const handleNoticeClick = (id: number) => {
    router.push(`/contact/notice/${id}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>고객센터</h1>
        <div className={styles.layout}>
          <CustomerSidebar activeMenu='notice' />
          <div className={styles.mainContent}>
            <div className={styles.topTitle}>
              <h2 className={styles.pageTitle}>공지사항</h2>
            </div>

            <div className={styles.noticeTableBox}>
              <table className={styles.noticeTable}>
                <tbody>
                  {currentNotices.map((notice) => (
                    <tr
                      key={notice.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleNoticeClick(notice.id)}
                    >
                      <td>{notice.title}</td>
                      <td>{notice.date}</td>
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
        </div>
      </div>
    </div>
  );
};

export default NoticePage;
