// 상단 import 그대로 유지
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

import ConcertDetailSection from './ConcertDetailSection';
import ReviewSection from './ReviewSection';
import LocationInfoSection from './LocationInfoSection';
import NoticeSection from './NoticeSection';
import styles from './ConcertDetail.module.css';

const TABS = ['상세보기', '관람후기', '장소정보', '예매 / 취소 안내'];

interface ConcertDetailProps {
  id: string;
}

interface ConcertImage {
  id: number;
  image: string;
  imagesRole: 'THUMBNAIL' | 'DESCRIPT_IMAGE';
}

interface ConcertData {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  reservationStartDate: string;
  reservationEndDate: string;
  price: string;
  rating: number;
  limitAge: number;
  durationTime: number;
  concertHallName: string;
  images: ConcertImage[];
  schedules: { id: number; concertTime: string }[];
  locationX?: number | null; // lng
  locationY?: number | null; // lat
}

const API_BASE = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL || 'http://localhost:8080';
const toAbsolute = (p?: string) =>
  !p ? '' : p.startsWith('http') ? p : `${API_BASE}${p}`;

export default function ConcertDetail({ id }: ConcertDetailProps) {
  const router = useRouter(); // ✅ 라우터 초기화
  const [concert, setConcert] = useState<ConcertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('상세보기');

  // 잘못된 id 검사
  useEffect(() => {
    if (!/^\d+$/.test(id)) {
      alert('유효하지 않은 페이지입니다.');
      window.location.href = '/concert';
    }
  }, [id]);

  // API 호출
  useEffect(() => {
    const fetchConcert = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/concerts/${id}`, {
          headers: { Accept: '*/*' },
        });
        if (!response.ok) throw new Error('데이터를 불러오지 못했습니다.');
        const data: ConcertData = await response.json();
        console.log('🎶 콘서트 데이터:', data);
        setConcert(data);
      } catch (error) {
        console.error('❌ 콘서트 상세 조회 실패:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConcert();
  }, [id]);

  const renderTabContent = () => {
    switch (activeTab) {
      case '상세보기':
        return (
          <ConcertDetailSection
            descriptionImages={concert?.images
              .filter((img) => img.imagesRole === 'DESCRIPT_IMAGE')
              .map((img) => toAbsolute(img.image))}
          />
        );
      case '관람후기':
        return <ReviewSection concertId={concert?.id ?? Number(id)} />;
      case '장소정보':
        return (
          <LocationInfoSection
            address={concert?.location ?? ''}
            lat={concert?.locationY ?? null}
            lng={concert?.locationX ?? null}
          />
        );
      case '예매 / 취소 안내':
        return <NoticeSection />;
      default:
        return null;
    }
  };

  const handleReserveClick = () => {
    const url = `/reserve/${id}/select-date`;
    window.open(url, '_blank', 'width=1000,height=600,resizable=no,scrollbars=yes');
  };

  if (loading) return <div>불러오는 중...</div>;
  if (!concert) return <div>콘서트 정보를 찾을 수 없습니다.</div>;

  const now = new Date();

  const resStart = concert.reservationStartDate
    ? new Date(concert.reservationStartDate)
    : null;
  const resEnd = concert.reservationEndDate ? new Date(concert.reservationEndDate) : null;

  // 기본값은 'before'
  let reservationStatus: 'before' | 'active' | 'ended' = 'before';

  if (resStart && resEnd) {
    if (now < resStart) reservationStatus = 'before';
    else if (now > resEnd) reservationStatus = 'ended';
    else reservationStatus = 'active';
  } else if (resStart && !resEnd) {
    reservationStatus = now < resStart ? 'before' : 'active';
  } else if (!resStart && resEnd) {
    reservationStatus = now > resEnd ? 'ended' : 'active';
  }
  // (둘 다 없으면 그대로 'before')

  const thumbnail = concert.images.find((img) => img.imagesRole === 'THUMBNAIL')?.image;

  return (
    <div className={styles.container}>
      <div className={styles.topSection}>
        <div className={styles.imageBox}>
          <Image
            src={toAbsolute(thumbnail) || '/events/event-2.png'}
            alt='concert'
            className={styles.image}
            fill
            unoptimized // ⚠️ localhost 이미지용
          />
        </div>
        <div className={styles.detailBox}>
          <h1 className={styles.title}>{concert.title}</h1>
          <div className={styles.detailRow}>
            <span>위치 {concert.location}</span>
            <span>소요시간 {concert.durationTime}분</span>
          </div>
          <div className={styles.detailRow}>
            <span>
              날짜 {concert.startDate} ~ {concert.endDate}
            </span>
            <span>나이제한 {concert.limitAge}세 이상</span>
          </div>
          <div className={styles.detailRow}>
            <span>가격 {concert.price}</span>
          </div>
        </div>
      </div>

      {/* 예매 버튼 */}
      <div className={styles.Btns}>
        {reservationStatus === 'active' && (
          <button className={styles.reserveButton} onClick={handleReserveClick}>
            예매하기
            <div>(예매 열림)</div>
          </button>
        )}
        {reservationStatus === 'before' && (
          <button className={styles.noticeButton} disabled>
            예매 준비 중입니다
            <div>예매 준비중</div>
          </button>
        )}
        {reservationStatus === 'ended' && (
          <button className={styles.noticeButton} disabled>
            예매가 종료되었습니다
            <div>예매 종료</div>
          </button>
        )}
      </div>

      {/* 탭 영역 */}
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
