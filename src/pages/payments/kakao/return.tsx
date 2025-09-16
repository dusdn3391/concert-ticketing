import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL || '';
const TOKEN_KEY = 'accessToken';

export default function KakaoReturn() {
  const router = useRouter();
  const [msg, setMsg] = useState('결제 승인 처리 중…');

  useEffect(() => {
    if (!router.isReady) return;

    const pgToken = String(router.query.pg_token || '');
    const reservationId = String(router.query.reservationId || '');
    const concertId = String(router.query.concertId || '');

    if (!pgToken) {
      setMsg('pg_token이 없습니다.');
      return;
    }

    (async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY) || '';
        const res = await fetch(
          `${API_BASE}/api/pay/approve?pg_token=${encodeURIComponent(pgToken)}`,
          { method: 'GET', headers: token ? { Authorization: `Bearer ${token}` } : {} },
        );
        if (!res.ok) throw new Error('결제 승인 실패');

        // 승인 성공 → 완료 페이지 이동
        if (concertId) {
          router.replace(`/reserve/${concertId}/payment?reservationId=${reservationId}`);
        } else {
          router.replace(`/reserve/payment`); // 폴백
        }
      } catch (e) {
        console.error(e);
        setMsg('결제 승인에 실패했습니다. 고객센터로 문의해주세요.');
      }
    })();
  }, [router]);

  return <div style={{ padding: 40 }}>{msg}</div>;
}
