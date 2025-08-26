import React, { useState, useEffect } from 'react';
import Link from 'next/link';

import styles from './Contact.module.css';

interface FAQItem {
  id: number;
  title: string;
  date: string;
  isNew?: boolean;
}

interface NoticeItem {
  id: number;
  title: string;
  content: string;
  date: string;
  status: string;
}

interface InquiryItem {
  id: number;
  title: string;
  date: string;
  status: string;
}

const CustomerCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('전체');
  const [expandedNotice, setExpandedNotice] = useState<number | null>(null);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [publicNotices, setPublicNotices] = useState<NoticeItem[]>([]); // ← API 데이터 저장

  const faqTabs = ['전체', '상품', '배송', '취소', '결제/환불', '기타'];

  const toggleNotice = (id: number) => {
    setExpandedNotice(expandedNotice === id ? null : id);
  };
  const categoryMap: Record<string, string> = {
    전체: '',
    상품: 'PRODUCT',
    배송: 'DELIVERY',
    취소: 'CANCEL',
    '결제/환불': 'PAYMENT_REFUND',
    기타: 'ETC',
  };

  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        // 탭에 맞는 카테고리 파라미터
        const categoryParam = categoryMap[activeTab]
          ? `?category=${categoryMap[activeTab]}`
          : '';

        const response = await fetch(`http://localhost:8080/api/faqs${categoryParam}`, {
          headers: {
            // Authorization: `Bearer ${token}`,
            Accept: '*/*',
          },
        });

        if (!response.ok) throw new Error('Failed to fetch FAQs');

        const data = await response.json();

        const mapped = (data.content || data).map((faq: any) => ({
          id: faq.id,
          title: faq.question,
          // date: new Date(faq.createdAt).toISOString().slice(0, 10),
        }));

        setFaqs(mapped);
      } catch (error) {
        console.error('❌ FAQ 조회 실패:', error);
        setFaqs([]);
      }
    };

    fetchFaqs();
  }, [activeTab]);

  useEffect(() => {
    const fetchInquiries = async () => {
      const token = localStorage.getItem('accessToken');

      // 토큰이 없으면 바로 "문의내역 없음" 처리
      if (!token) {
        setNotices([]); // 빈 배열로 상태 세팅
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8080/api/inquiries?page=0&size=5`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: '*/*',
            },
          },
        );

        if (!response.ok) throw new Error('Failed to fetch inquiries');

        const data = await response.json();

        const sorted = (data.content || [])
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .map((inquiry: any) => ({
            id: inquiry.id,
            title: inquiry.title,
            date: new Date(inquiry.createdAt).toISOString().slice(0, 10),
            status: inquiry.status,
          }));

        setNotices(sorted.slice(0, 1)); // 최근 문의 1개만
      } catch {
        // 여기서도 굳이 콘솔 에러 찍지 않음
        setNotices([]);
      }
    };

    fetchInquiries();
  }, []);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/notices`, {
          headers: {
            // Authorization: `Bearer ${token}`,
            Accept: '*/*',
          },
        });

        if (!response.ok) throw new Error('Failed to fetch notices');

        const data = await response.json();

        const mapped = (data.content || data).map((notice: any) => ({
          id: notice.id,
          title: notice.title,
          date: new Date(notice.createdAt).toISOString().slice(0, 10),
          status: notice.status,
          content: notice.content,
        }));

        setPublicNotices(mapped);
      } catch (error) {
        console.error('❌ 공지사항 조회 실패:', error);
      }
    };

    fetchNotices();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>고객센터</h1>
        </div>

        {/* FAQ Section */}
        <div className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>FAQ</h2>

            <div className={styles.tabContainer}>
              <div className={styles.tabList}>
                {faqTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`${styles.tab} ${
                      activeTab === tab ? styles.activeTab : styles.inactiveTab
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.faqList}>
              {faqs.length === 0 ? (
                <p>선택하신 카테고리의 FAQ가 없습니다.</p>
              ) : (
                faqs.map((faq) => (
                  <div key={faq.id} className={styles.faqItem}>
                    <span className={styles.faqTitle}>{faq.title}</span>
                    {/* <span className={styles.faqDate}>{faq.date}</span> */}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 1:1 문의 Section */}
        <div className={styles.section}>
          <div className={styles.sectionContent}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>1:1문의</h2>
              <Link href='/contact/write'>
                <button className={styles.moreButton}>1:1문의하기</button>
              </Link>
            </div>

            <div className={styles.noticeList}>
              {notices.length === 0 ? (
                <div className={styles.noticeItem}>
                  <span className={styles.noticeTitle}>최근 문의 내역이 없습니다.</span>
                </div>
              ) : (
                notices.map((inquiry) => (
                  <Link href={`/mypage/inquiry/${inquiry.id}`} key={inquiry.id}>
                    {' '}
                    <div key={inquiry.id} className={styles.noticeItem}>
                      <div className={styles.noticeLeft}>
                        <span className={styles.statusBadge}>
                          {inquiry.status === 'COMPLETED' ? '답변완료' : '처리중'}
                        </span>
                        <span className={styles.noticeTitle}>{inquiry.title}</span>
                      </div>
                      <div className={styles.noticeRight}>
                        <span className={styles.noticeDate}>{inquiry.date}</span>
                        <button className={styles.arrowButton}>&gt;</button>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 공지사항 Section */}
        <div className={styles.section}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>공지사항</h2>

            <div className={styles.publicNoticeList}>
              {publicNotices.map((notice) => (
                <div key={notice.id} className={styles.publicNoticeItem}>
                  <button
                    onClick={() => toggleNotice(notice.id)}
                    className={styles.publicNoticeButton}
                  >
                    <span className={styles.publicNoticeTitle}>{notice.title}</span>
                    <span
                      className={`${styles.expandIcon} ${
                        expandedNotice === notice.id ? styles.expanded : ''
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {expandedNotice === notice.id && (
                    <div className={styles.publicNoticeContent}>
                      <div className={styles.publicNoticeText}>{notice.content}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.moreButtonContainer}>
              <Link href='/contact/notice'>
                <button className={styles.moreNoticeButton}>공지사항 더보기</button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCenter;
