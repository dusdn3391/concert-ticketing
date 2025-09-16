import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import ProgressNav from '../Navbar/ProgressNav';
import SelectDate from './Selecting';
import ConcertRightPanel from './ConcertInfos';
import styles from './ConcertDate.module.css';
import { useDateStore } from '@/stores/dateStore'; // 🔹 추가

const API_BASE = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL ?? '';
const TOKEN_KEY = 'accessToken';
const toAbsolute = (p?: string) =>
  !p ? '' : p.startsWith('http') ? p : `${API_BASE}${p}`;

type ApiSeat = { id: number; rowName: string; seatNumber: string };
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

export default function ConcertDate() {
  const router = useRouter();
  const { concertId } = router.query;

  // 🔹 store setter
  const { setPosterUrl } = useDateStore();

  // 데이터 상태
  const [data, setData] = useState<ConcertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ✅ 포스터(blob URL)
  const [posterSrc, setPosterSrc] = useState<string>('');

  // 썸네일 원본 URL (절대 경로로 변환)
  const thumbnailUrl = useMemo(
    () => toAbsolute(data?.images.find((i) => i.imagesRole === 'THUMBNAIL')?.image),
    [data],
  );

  // 일정 정리 (null 제거 + 시간순)
  const schedules = useMemo(
    () =>
      (data?.schedules ?? [])
        .filter((s): s is { id: number; concertTime: string } => !!s.concertTime)
        .sort(
          (a, b) => new Date(a.concertTime).getTime() - new Date(b.concertTime).getTime(),
        ),
    [data?.schedules],
  );

  // 좌석 총합
  const totalSeatCount = useMemo(
    () =>
      (data?.seatSections ?? []).reduce((sum, sec) => sum + (sec.seats?.length ?? 0), 0),
    [data?.seatSections],
  );

  // 콘서트 데이터 패칭
  useEffect(() => {
    if (!router.isReady) return;

    if (!concertId || Array.isArray(concertId) || !/^\d+$/.test(String(concertId))) {
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
        setErrorMsg(null);
      } catch (e: any) {
        console.error('❌ 콘서트 조회 실패:', e);
        setErrorMsg(e?.message || '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchConcert();
  }, [router.isReady, concertId]);

  // ✅ 포스터(blob URL) 가져오고 store에도 저장
  useEffect(() => {
    let canceled = false;

    const run = async () => {
      try {
        if (!thumbnailUrl) {
          if (!canceled) {
            setPosterSrc('');
            setPosterUrl(null); // 🔹 store 초기화
          }
          return;
        }

        const token =
          typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
        if (!token) {
          if (!canceled) {
            setPosterSrc('');
            setPosterUrl(null); // 🔹 store 초기화
          }
          return;
        }

        const resp = await fetch(thumbnailUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error(`POSTER_HTTP_${resp.status}`);

        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);

        if (!canceled) {
          setPosterSrc(url);
          setPosterUrl(url); // 🔹 store에 저장
        }
      } catch (err) {
        console.error('포스터 로딩 오류:', err);
        if (!canceled) {
          setPosterSrc('');
          setPosterUrl(null); // 🔹 store 초기화
        }
      }
    };

    run();

    return () => {
      canceled = true;
    };
  }, [thumbnailUrl, setPosterUrl]);

  const handleNext = () => {
    router.push(`/reserve/${concertId}/select-seat`);
  };

  // 분기 렌더
  if (loading) {
    return <div className={styles.wrapper}>불러오는 중…</div>;
  }

  if (errorMsg || !data) {
    return (
      <div className={styles.wrapper}>
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
        <SelectDate
          startDate={data.startDate}
          endDate={data.endDate}
          totalSeatCount={totalSeatCount}
          schedules={schedules}
        />
        <ConcertRightPanel
          showNextButton
          onNextClick={handleNext}
          concertId={Array.isArray(concertId) ? concertId[0] : concertId}
          posterUrl={posterSrc || '/events/event-2.png'}
          posterAlt={data.title}
        />
      </div>
    </div>
  );
}
