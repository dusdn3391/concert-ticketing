// pages/concert/[id].tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { GetServerSideProps } from 'next';

import ConcertDetailSection from '@/components/user/concert/ConcertDetailSection';
import ReviewSection from '@/components/user/concert/ReviewSection';
import LocationInfoSection from '@/components/user/concert/LocationInfoSection';
import NoticeSection from '@/components/user/concert/NoticeSection';
import styles from './ConcertDetail.module.css';

const TABS = ['상세보기', '관람후기', '장소정보', '예매 / 취소 안내'];

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params ?? {};

  if (!id || Array.isArray(id) || !/^\d+$/.test(id as string)) {
    return {
      redirect: {
        destination: '/concert',
        permanent: false,
      },
    };
  }

  return {
    props: { id },
  };
};
export default function ConcertDetail() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (typeof id !== 'string') return;

    if (!/^\d+$/.test(id)) {
      alert('유효하지 않은 페이지입니다.');
      router.push('/concert');
    }
  }, [id, router]);

  const mockData = {
    image: '/events/event-2.png',
    title: '콘서트 타이틀',
    location: '서울 올림픽홀',
    duration: '120',
    date: '2025.06.01 ~ 2025.06.10',
    age: '12세 이상',
    price: '99,000원',
  };

  const [activeTab, setActiveTab] = useState('상세보기');

  const renderTabContent = () => {
    switch (activeTab) {
      case '상세보기':
        return <ConcertDetailSection />;
      case '관람후기':
        return <ReviewSection />;
      case '장소정보':
        return <LocationInfoSection />;
      case '예매 / 취소 안내':
        return <NoticeSection />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.topSection}>
        <div className={styles.imageBox}>
          <Image src={mockData.image} alt='concert' className={styles.image} />
        </div>
        <div className={styles.detailBox}>
          <h1 className={styles.title}>{mockData.title}</h1>
          <div className={styles.detailRow}>
            <span>위치 {mockData.location}</span>
            <span>소요시간 {mockData.duration} minutes</span>
          </div>
          <div className={styles.detailRow}>
            <span>날짜 {mockData.date}</span>
            <span>나이제한 {mockData.age}</span>
          </div>
          <div className={styles.detailRow}>
            <span>가격 {mockData.price}</span>
          </div>
        </div>
      </div>

      <button className={styles.noticeButton} disabled>
        예매 준비 중입니다
        <div>예매 준비중</div>
      </button>

      <button className={styles.reserveButton}>
        예매하기
        <div>(예매 열림)</div>
      </button>

      <div className={styles.tabContainer}>
        <div className={styles.tabWrapper}>
          {TABS.map((tab) => (
            <div
              key={tab}
              className={activeTab === tab ? styles.activeTabButton : styles.tabButton}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
        </div>
        <div className={styles.tabContent}>{renderTabContent()}</div>
      </div>
    </div>
  );
}
