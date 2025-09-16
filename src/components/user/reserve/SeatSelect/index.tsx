import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import ProgressNav from '../Navbar/ProgressNav'; // 경로는 프로젝트 구조에 맞게 조정
import styles from './SeatSelect.module.css';
import LeftPanel from './SeatEntire';
import SelectedSeat from './SelectedSeat';

const API_BASE = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL ?? '';
const TOKEN_KEY = 'accessToken';

type ApiSeat = {
  id: number;
  rowName: string;
  seatNumber: string;
  status?: 'available' | 'occupied' | 'disabled';
};
type ApiSeatSection = {
  id: number;
  sectionName: string;
  colorCode: string;
  price: number;
  seats: ApiSeat[];
};
type ConcertImage = {
  id: number;
  image: string;
  imagesRole: 'THUMBNAIL' | 'DESCRIPT_IMAGE' | 'SVG_IMAGE';
};
type ConcertSchedule = { id: number; concertTime: string | null };
type ConcertData = {
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
  concertHallName: string | null;
  images: ConcertImage[];
  schedules: ConcertSchedule[];
  seatSections: ApiSeatSection[];
  locationX?: number | null;
  locationY?: number | null;
};

export default function SeatSelect() {
  const router = useRouter();
  const { concertId } = router.query;

  const [data, setData] = useState<ConcertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalSeatCount = useMemo(
    () =>
      (data?.seatSections ?? []).reduce((sum, sec) => sum + (sec.seats?.length ?? 0), 0),
    [data?.seatSections],
  );

  useEffect(() => {
    if (!router.isReady) return;

    const id = Array.isArray(concertId) ? concertId[0] : concertId;
    if (!id || !/^\d+$/.test(String(id))) {
      setErrorMsg('잘못된 접근입니다.');
      setLoading(false);
      return;
    }

    const fetchConcert = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/concerts/${id}`, {
          headers: { Accept: '*/*' },
        });
        if (!res.ok) throw new Error('콘서트 정보를 불러오지 못했습니다.');
        const json: ConcertData = await res.json();

        // ✅ seatSections 로드 확인 로그
        console.group('[SeatSelect] seatSections loaded');
        console.log('concertId:', json.id, 'title:', json.title);
        console.log('seatSections count:', json.seatSections?.length ?? 0);
        console.table(
          (json.seatSections ?? []).map((s) => ({
            id: s.id,
            name: s.sectionName,
            colorCode: s.colorCode,
            price: s.price,
            seats: s.seats?.length ?? 0,
          })),
        );
        console.groupEnd();

        setData(json);
        setErrorMsg(null);
      } catch (e: any) {
        console.error('❌ 좌석 선택용 콘서트 조회 실패:', e);
        setErrorMsg(e?.message || '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchConcert();
  }, [router.isReady, concertId]);

  // ✅ SVG_IMAGE 절대 URL 만들기
  const svgUrl = useMemo(() => {
    const raw = data?.images.find((i) => i.imagesRole === 'SVG_IMAGE')?.image;
    if (!raw) return undefined;
    return raw.startsWith('http') ? raw : `${API_BASE}${raw}`;
  }, [data]);

  const handlePrev = () => {
    const id = Array.isArray(concertId) ? concertId[0] : concertId;
    router.push(`/reserve/${id}/select-date`);
  };

  const handleNext = () => {
    const id = Array.isArray(concertId) ? concertId[0] : concertId;
    router.push(`/reserve/${id}/confirm-ticket`);
  };

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <ProgressNav />
        <div className={styles.container} style={{ padding: 24 }}>
          불러오는 중…
        </div>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className={styles.wrapper}>
        <ProgressNav />
        <div className={styles.container} style={{ padding: 24 }}>
          {errorMsg || '콘서트 데이터를 찾을 수 없습니다.'}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <ProgressNav />
      <div className={styles.container}>
        <LeftPanel
          concertId={data.id}
          title={data.title}
          location={data.location}
          svgUrl={svgUrl}
          seatSections={data.seatSections}
        />

        <SelectedSeat onPrev={handlePrev} onNext={handleNext} />
      </div>
    </div>
  );
}
