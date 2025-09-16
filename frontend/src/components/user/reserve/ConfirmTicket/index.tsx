import React, { useRef, useState } from 'react';
import { useRouter } from 'next/router';

import ProgressNav from '../Navbar/ProgressNav';
import styles from './ConfirmTicket.module.css';
import LeftPanel, { WriteAddressHandle } from './WriteAddress';
import RightPanel from '../SelectDate/ConcertInfos';

import { useDateStore } from '@/stores/dateStore';

const API_BASE = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL || '';
const TOKEN_KEY = 'accessToken';

type ReservePayload = {
  concertScheduleId: number;
  seatReservationIds: string[];
  deliveryAddress?: {
    name: string;
    phone: string;
    address: string;
    detailAddress: string;
  } | null;
  state: string;
};

function isMobileUA() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

const CombineTicketPage = () => {
  const router = useRouter();
  const addrRef = useRef<WriteAddressHandle>(null);

  const {
    selectedScheduleId,
    selectedSectionId,
    selectedSeats,
    seatCount,
    totalPrice,
    posterUrl,
  } = useDateStore();

  const [submitting, setSubmitting] = useState(false);

  const extractConcertIdFromPath = () => {
    if (typeof window === 'undefined') return null;
    const segs = window.location.pathname.split('/').filter(Boolean);
    const nums = segs.filter((s) => /^\d+$/.test(s));
    return nums.length ? nums[nums.length - 1] : null;
  };

  const submitReservation = async () => {
    try {
      if (!selectedScheduleId) {
        alert('회차(날짜)를 선택해주세요.');
        return;
      }
      if (!selectedSectionId || (selectedSeats?.length ?? 0) === 0) {
        alert('좌석을 선택해주세요.');
        return;
      }

      const ok = addrRef.current?.validate() ?? true;
      if (!ok) {
        alert('배송을 선택하셨다면 이름/전화/주소는 필수입니다.');
        return;
      }
      const addressValues = addrRef.current?.getValues();

      const token =
        typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

      const payload: ReservePayload = {
        concertScheduleId: selectedScheduleId,
        seatReservationIds: (selectedSeats || []).map((s) => String(s.id)),
        deliveryAddress: addressValues?.isDeliverySelected
          ? {
              name: addressValues?.name ?? '',
              phone: addressValues?.phone ?? '',
              address: addressValues?.address ?? '',
              detailAddress: addressValues?.detail ?? '',
            }
          : null,
        state: 'RESERVED',
      };

      setSubmitting(true);

      // 1) 예매 생성
      const reserveRes = await fetch(`${API_BASE}/api/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!reserveRes.ok) {
        const msg = await reserveRes.text().catch(() => '');
        throw new Error(msg || '예매 요청에 실패했습니다.');
      }
      const reserveData = await reserveRes.json();

      const concertId = reserveData?.concertId ?? extractConcertIdFromPath() ?? '';

      const priceToPay = Number(totalPrice ?? reserveData?.totalPrice ?? 0);
      if (priceToPay <= 0) {
        // 무료 결제 → 바로 완료 페이지
        router.replace(`/reserve/${concertId}/payment`);
        return;
      }

      // 2) 카카오페이 ready 호출
      const origin = typeof window !== 'undefined' ? window.location.origin : '';

      const readyRes = await fetch(`${API_BASE}/api/pay/ready`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          itemName: reserveData?.concertTitle ?? '나랑 콘서트', // 공연명
          quantity: String(seatCount || 1), // 티켓 수량
          totalPrice: String(priceToPay), // 총 가격
          // approvalUrl: `${origin}/reserve/${concertId}/payment`,
          // cancelUrl: `${origin}/payments/kakao/cancel`,
          // failUrl: `${origin}/payments/kakao/fail`,
        }),
      });
      if (!readyRes.ok) {
        const msg = await readyRes.text().catch(() => '');
        throw new Error(msg || '카카오페이 준비(ready)에 실패했습니다.');
      }
      const ready = await readyRes.json();

      const redirectUrl = isMobileUA()
        ? (ready?.next_redirect_mobile_url ?? ready?.next_redirect_pc_url)
        : (ready?.next_redirect_pc_url ?? ready?.next_redirect_mobile_url);

      if (!redirectUrl) throw new Error('카카오페이 리다이렉트 URL이 없습니다.');

      // 결제창 이동
      window.location.href = redirectUrl;
    } catch (err: any) {
      console.error(err);
      alert(err?.message || '예매/결제 준비 중 오류가 발생했습니다.');
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <ProgressNav />
      <div className={styles.container}>
        <LeftPanel ref={addrRef} />
        <RightPanel
          showPrevButton
          showNextButton
          onPrevClick={() => router.push('/reserve/select-seat')}
          onNextClick={submitReservation}
          posterUrl={posterUrl || undefined}
        />
      </div>

      {submitting && (
        <div className={styles.blockingOverlay}>
          <div className={styles.spinner} />
          <div>예매/결제 준비 중…</div>
        </div>
      )}
    </div>
  );
};

export default CombineTicketPage;
