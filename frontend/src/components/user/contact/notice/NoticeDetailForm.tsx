import { useRouter } from 'next/router';
import { useEffect } from 'react';

import CustomerSidebar from '@/components/user/contact/ContactNav';
import styles from './NoticeDetail.module.css';

interface NoticeDetailProps {
  id: string;
}

const NoticeDetailPage = ({ id }: NoticeDetailProps) => {
  const router = useRouter();

  useEffect(() => {
    if (!/^\d+$/.test(id)) {
      alert('유효하지 않은 페이지입니다.');
      window.location.href = '/notice'; // 클라이언트 라우팅이 필요하면 router.push 사용 가능
    }
  }, [id]);

  const dummyNotice = {
    title: '공지사항 제목입니다',
    author: '관리자',
    date: '2024-04-11',
    views: 150,
    content: [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...',
      '/images/sample-image.jpg',
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua...',
    ],
  };

  const handleBackClick = () => {
    router.push('/contact/notice');
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

            <div className={styles.noticeBox}>
              <h3 className={styles.noticeTitle}>{dummyNotice.title}</h3>
              <div className={styles.noticeInfo}>
                <span>작성일 : {dummyNotice.date}</span>
                <span>작성자 : {dummyNotice.author}</span>
                <span>조회수 : {dummyNotice.views}</span>
              </div>

              <div className={styles.noticeContent}>
                <p>{dummyNotice.content[0]}</p>
                <p>{dummyNotice.content[2]}</p>
              </div>

              <div className={styles.buttonContainer}>
                <button className={styles.backButton} onClick={handleBackClick}>
                  목록으로
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeDetailPage;
