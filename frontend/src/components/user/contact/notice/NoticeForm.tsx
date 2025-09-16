import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import CustomerSidebar from '@/components/user/contact/ContactNav';
import Pagination from '@/components/user/common/Pagination';
import styles from './NoticeForm.module.css';

interface NoticeItem {
  id: number;
  title: string;
  content: string;
  date: string;
}

const NoticePage = () => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const noticesPerPage = 5;

  // 공지사항 API 호출
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/notices`, {
          headers: {
            Accept: '*/*',
          },
        });

        if (!response.ok) throw new Error('공지사항 불러오기 실패');

        const data = await response.json();

        const mapped = (data.content || data).map((notice: any) => ({
          id: notice.id,
          title: notice.title,
          content: notice.content,
          date: new Date(notice.createdAt).toISOString().slice(0, 10),
        }));

        setNotices(mapped);
      } catch (error) {
        console.error('❌ 공지사항 조회 실패:', error);
      }
    };

    fetchNotices();
  }, []);

  const indexOfLastNotice = currentPage * noticesPerPage;
  const indexOfFirstNotice = indexOfLastNotice - noticesPerPage;
  const currentNotices = notices.slice(indexOfFirstNotice, indexOfLastNotice);
  const totalPages = Math.ceil(notices.length / noticesPerPage);

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
                  {currentNotices.length === 0 && (
                    <tr>
                      <td colSpan={2} style={{ textAlign: 'center' }}>
                        공지사항이 없습니다.
                      </td>
                    </tr>
                  )}
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
