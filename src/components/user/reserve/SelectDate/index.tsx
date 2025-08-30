import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import ProgressNav from '../Navbar/ProgressNav';
import SelectDate from './Selecting';
import ConcertRightPanel from './ConcertInfos';
import styles from './ConcertDate.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL;
const toAbsolute = (p?: string) =>
  !p ? '' : p.startsWith('http') ? p : `${API_BASE}${p}`;

type ApiSeat = {
  id: number;
  rowName: string;
  seatNumber: string;
};

type ApiSeatSection = {
  id: number;
  sectionName: string;
  colorCode: string;
  price: number;
  seats: ApiSeat[]; // 빈 배열일 수 있음
};

type ConcertImage = {
  id: number;
  image: string;
  imagesRole: 'THUMBNAIL' | 'DESCRIPT_IMAGE' | 'SVG_IMAGE'; // 응답에 SVG_IMAGE도 옴
};

type ConcertSchedule = {
  id: number;
  concertTime: string | null; // ✅ null 허용 (응답과 일치)
};

type ConcertData = {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  reservationStartDate: string;
  reservationEndDate: string;
  price: string;
  rating: number;
  limitAge: number;
  durationTime: number;
  concertHallName: string | null;
  images: ConcertImage[];
  schedules: ConcertSchedule[];
  seatSections: ApiSeatSection[]; // ✅ 추가
  locationX?: number | null;
  locationY?: number | null;
};

const ConcertDate = () => {
  const router = useRouter();
  const { concertId } = router.query;

  const [data, setData] = useState<ConcertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 썸네일/설명 이미지 계산
  const thumbnail = useMemo(
    () => toAbsolute(data?.images.find((i) => i.imagesRole === 'THUMBNAIL')?.image),
    [data],
  );
  const descriptionImages = useMemo(
    () =>
      (data?.images || [])
        .filter((i) => i.imagesRole === 'DESCRIPT_IMAGE')
        .map((i) => toAbsolute(i.image)),
    [data],
  );

  useEffect(() => {
    if (!router.isReady) return;
    if (!concertId || Array.isArray(concertId) || !/^\d+$/.test(concertId)) {
      setErrorMsg('잘못된 접근입니다.');
      setLoading(false);
      return;
    }

    const fetchConcert = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/concerts/${concertId}`, {
          headers: { Accept: '*/*' },
        });
        if (!res.ok) throw new Error('콘서트 정보를 불러오지 못했습니다.');
        const json: ConcertData = await res.json();
        setData(json);
      } catch (e: any) {
        console.error('❌ 콘서트 조회 실패:', e);
        setErrorMsg(e.message || '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchConcert();
  }, [router.isReady, concertId]);

  const handleNext = () => {
    // 다음 단계(좌석 선택)로 이동 — 동적 라우트로 이어붙이기
    router.push(`/reserve/${concertId}/select-seat`);
  };

  if (loading) return <div className={styles.wrapper}>불러오는 중…</div>;
  if (errorMsg || !data) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.container} style={{ padding: 24 }}>
          {errorMsg || '콘서트 데이터를 찾을 수 없습니다.'}
        </div>
      </div>
    );
  }

  const totalSeatCount = (data.seatSections || []).reduce(
    (sum, sec) => sum + (sec.seats?.length ?? 0),
    0,
  );
  return (
    <div className={styles.wrapper}>
      <ProgressNav />

      <div className={styles.container}>
        {/* 날짜/회차 선택에 필요한 데이터 내려주기 */}
        <SelectDate
          startDate={data.startDate}
          endDate={data.endDate}
          totalSeatCount={totalSeatCount}
        />

        {/* 우측 패널 정보 내려주기 */}
        <ConcertRightPanel
          showNextButton
          onNextClick={handleNext}
          posterUrl={thumbnail || '/events/event-2.png'}
          title={data.title}
          location={data.location}
          durationTime={data.durationTime}
          price={data.price}
          rating={data.rating}
        />
      </div>
    </div>
  );
};

export default ConcertDate;
