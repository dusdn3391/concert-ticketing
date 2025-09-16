// ConcertInfos.tsx
import { useRouter } from 'next/router';
import React, { useMemo, useState } from 'react';
import styles from './ConcertInfos.module.css';
import { useDateStore } from '@/stores/dateStore';

const API_BASE = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL || 'http://localhost:8080';
const TOKEN_KEY = 'accessToken';

type AddressValues = {
  isDeliverySelected?: boolean;
  name?: string;
  phone?: string;
  address?: string;
  detail?: string;
};

type ConcertInfoProps = {
  showNextButton?: boolean;
  showPrevButton?: boolean;
  onNextClick?: () => void;
  onPrevClick?: () => void;
  posterUrl?: string; // fallback
  posterAlt?: string;
  concertId?: string | number;

  /** ▼ 추가: 다음단계 클릭 시 내부에서 바로 POST 실행할지 */
  postOnNext?: boolean;

  /** ▼ 추가: POST 시 함께 보낼 배송지(선택). 없으면 deliveryAddress는 null */
  address?: AddressValues;

  /** ▼ 추가: POST 성공 후 이동할 경로 (기본: /reserve/payment) */
  redirectOnSuccess?: string;
};

type ReservePayload = {
  concertScheduleId: number;
  seatReservationIds: string[]; // string 배열
  deliveryAddress: {
    name: string;
    phone: string;
    address: string;
    detailAddress: string;
  } | null;
  state: 'UNAVAILABLE' | 'AVAILABLE' | string;
};

const ConcertInfo = ({
  showNextButton = true,
  showPrevButton = false,
  onNextClick,
  onPrevClick,
  posterUrl: posterUrlProp,
  posterAlt = '공연 포스터',
  concertId,

  postOnNext = false,
  address,
  redirectOnSuccess = '/reserve/payment',
}: ConcertInfoProps) => {
  const router = useRouter();
  const {
    selectedDate,
    selectedScheduleId, // ✅ store에 추가되어 있다고 가정
    seatCount,
    totalPrice,
    selectedSeats,
    posterUrl: posterUrlStore,
  } = useDateStore();

  const [submitting, setSubmitting] = useState(false);

  const effectivePoster = posterUrlStore || posterUrlProp || '/events/event-2.png';

  const nextDisabled = useMemo(() => {
    if (!selectedDate) return true;
    if (!selectedScheduleId) return true;
    if (!seatCount || seatCount < 1) return true;
    return false;
  }, [selectedDate, selectedScheduleId, seatCount]);

  const doPost = async () => {
    if (nextDisabled) return;

    try {
      setSubmitting(true);

      const token =
        typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

      const payload: ReservePayload = {
        concertScheduleId: Number(selectedScheduleId),
        seatReservationIds: (selectedSeats || []).map((s) => String(s.id)),
        deliveryAddress: address?.isDeliverySelected
          ? {
              name: address?.name ?? '',
              phone: address?.phone ?? '',
              address: address?.address ?? '',
              detailAddress: address?.detail ?? '',
            }
          : null,
        state: 'UNAVAILABLE', // ✅ 요청: 대문자
      };

      const res = await fetch(`${API_BASE}/api/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || '예매 요청에 실패했습니다.');
      }

      // 성공 처리
      router.push(redirectOnSuccess);
    } catch (err: any) {
      alert(err?.message || '예매 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    // 우선 순위 1) 외부 핸들러
    if (onNextClick) return onNextClick();

    // 2) 내부 POST
    if (postOnNext) {
      return void doPost();
    }

    // 3) 기본 이동(좌석 선택 페이지 등)
    if (concertId) router.push(`/reserve/${concertId}/select-seat`);
    else router.push('/reserve/select-seat');
  };

  const handlePrev = () => {
    if (onPrevClick) return onPrevClick();
    router.back();
  };

  return (
    <div className={styles.rightPanel}>
      <div className={styles.concertInfo}>
        <div className={styles.poster}>
          <img src={effectivePoster} alt={posterAlt} className={styles.posterImg} />
        </div>

        <div className={styles.infoBox}>
          <p>예매정보</p>
          <p>
            일시: {selectedDate ? selectedDate.toLocaleDateString('ko-KR') : '미선택'}
          </p>
          <p>티켓수량: {seatCount}장</p>
          <p>총결제: {totalPrice.toLocaleString()}원</p>
        </div>
      </div>

      <div className={styles.buttonBox}>
        {showPrevButton && (
          <button
            className={styles.prevButton}
            onClick={handlePrev}
            disabled={submitting}
          >
            이전단계
          </button>
        )}
        {showNextButton && (
          <button
            className={styles.nextButton}
            onClick={handleNext}
            disabled={submitting || (postOnNext ? nextDisabled : false)}
            title={postOnNext && nextDisabled ? '날짜/회차/좌석을 선택하세요' : undefined}
          >
            {submitting ? '요청 중…' : '다음단계'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ConcertInfo;
