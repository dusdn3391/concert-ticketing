import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import styles from './Mypage.module.css';
import MypageNav from '@/components/user/mypage/MypageNav';

const API_BASE = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL || 'http://localhost:8080';

interface ReservationRow {
  id: number;
  date: string;
  number: string;
  title: string;
  showTime: string;
  count: number;
  status: string;
}

interface Inquiry {
  id: number;
  title: string;
  state: string;
  createdAt: string;
  date: string;
}

interface Notice {
  id: number;
  title: string;
  createdAt: string;
}

type ImageItem = {
  id: number;
  image?: string;
  imageUrl?: string;
  imagesRole?: string;
  role?: string;
  images_role?: string;
};
type ConcertLite = {
  id: number;
  title: string;
  location?: string | null;
  images?: ImageItem[];
};
type ReserveItem = {
  id: number;
  status?: string;
  state?: string;
  concert?: ConcertLite;
  concertScheduleDate?: string;
  seatReservations?: Array<{ id: number }>;
  createdAt?: string;
  updatedAt?: string;
};
type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

export default function EntireMypage() {
  const router = useRouter(); // ✅ push에 사용

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [latestNotice, setLatestNotice] = useState<Notice | null>(null);
  const [currentPage, setCurrentPage] = useState(0); // 문의 페이징 유지
  const inquiriesPerPage = 5;

  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loadingReserve, setLoadingReserve] = useState(false);

  /* ===== 날짜 유틸 ===== */
  const fmtDateTime = (v?: string) => {
    if (!v) return '';
    const dt = new Date(v);
    if (isNaN(dt.getTime())) return v;
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    const hh = String(dt.getHours()).padStart(2, '0');
    const mi = String(dt.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
  };
  const fmtDate = (v?: string) => {
    if (!v) return '';
    const dt = new Date(v);
    if (isNaN(dt.getTime())) return v;
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isCancelled = (r: ReserveItem) => {
    const s = (r.state ?? r.status ?? '').toUpperCase();
    return s === 'CANCELLED' || s === 'CANCELED' || s.includes('CANCEL');
  };
  const pickStatus = (r: ReserveItem) =>
    isCancelled(r)
      ? '취소완료'
      : (r.status ?? ((r.seatReservations?.length ?? 0) > 0 ? '예약완료' : '-'));

  const pickSortKey = (r: ReserveItem) =>
    r.createdAt || r.updatedAt || r.concertScheduleDate || '';

  /* ===== 예매 2건 조회 ===== */
  const fetchRecentReservations = async () => {
    setLoadingReserve(true);
    try {
      const token = localStorage.getItem('accessToken');
      const url = `${API_BASE}/api/reserve?page=0&size=2`;
      const res = await fetch(url, {
        headers: {
          Accept: '*/*',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PageResponse<ReserveItem> | ReserveItem[] = await res.json();

      const items = Array.isArray(data) ? data : (data.content ?? []);

      const sorted = [...items].sort(
        (a, b) => new Date(pickSortKey(b)).getTime() - new Date(pickSortKey(a)).getTime(),
      );

      const rows: ReservationRow[] = sorted.slice(0, 2).map((r) => ({
        id: r.id,
        date: fmtDate(r.createdAt || r.concertScheduleDate) || '-',
        number: String(r.id),
        title: r.concert?.title ?? '콘서트',
        showTime: fmtDateTime(r.concertScheduleDate) || '-',
        count: r.seatReservations?.length ?? 0,
        status: pickStatus(r),
      }));

      setReservations(rows);
    } catch (e) {
      console.error('❌ 예매내역 조회 실패:', e);
      setReservations([]);
    } finally {
      setLoadingReserve(false);
    }
  };

  /* ===== 문의 1건/공지 1건 ===== */
  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) throw new Error('No access token found');

        const response = await fetch(
          `${API_BASE}/api/inquiries?page=${currentPage}&size=${inquiriesPerPage}`,
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
            (a: Inquiry, b: Inquiry) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .map((inquiry: any) => ({
            id: inquiry.id,
            title: inquiry.title,
            state: inquiry.state,
            date: inquiry.createdAt,
          }));

        setInquiries(sorted.slice(0, 1));
      } catch (error) {
        console.error('❌ 문의 조회 실패:', error);
      }
    };

    const fetchLatestNotice = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/notices`, {
          headers: { Accept: '*/*' },
        });
        if (!res.ok) throw new Error('Failed to fetch notices');
        const data = await res.json();
        if (Array.isArray(data)) {
          const sorted = data.sort(
            (a: Notice, b: Notice) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          setLatestNotice(sorted[0]);
        }
      } catch (err) {
        console.error('❌ 공지 조회 실패:', err);
      }
    };

    fetchInquiries();
    fetchLatestNotice();
  }, [currentPage]);

  useEffect(() => {
    fetchRecentReservations();
  }, []);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
  }, []);

  return (
    <div className={styles.all}>
      <div className={styles.margin}>
        <h1 className={styles.title}>마이페이지</h1>
        <div className={styles.container}>
          <MypageNav />
          <section className={styles.content}>
            <div className={styles.noticeBox}>
              <div className={styles.tabs}>
                <div className={styles.notice}>NOTICE</div>
                <div className={styles.recentNotice}>
                  {latestNotice ? latestNotice.title : '공지사항이 없습니다.'}
                </div>
              </div>
            </div>

            <div className={styles.historyBox}>
              <div className={styles.sectionHeader}>
                <div className={styles.border} />
                <h3>최근 예매내역</h3>
                <button
                  className={styles.moreButton}
                  onClick={() => router.push('/mypage/ticketing')} // ✅ 더보기 → 예매확인 페이지
                >
                  더보기
                </button>
              </div>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>예매 날짜</th>
                    <th>예매 번호</th>
                    <th>공연명</th>
                    <th>관람일시</th>
                    <th>예매수</th>
                    <th>예매상태</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingReserve ? (
                    <tr>
                      <td colSpan={6}>로딩 중…</td>
                    </tr>
                  ) : reservations.length === 0 ? (
                    <tr>
                      <td colSpan={6}>예매 내역이 없습니다.</td>
                    </tr>
                  ) : (
                    reservations.map((item) => (
                      <tr key={item.id}>
                        <td>{item.date}</td>
                        <td>{item.number}</td>
                        <td>{item.title}</td>
                        <td>{item.showTime}</td>
                        <td>{item.count}</td>
                        <td>{item.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className={styles.asOf}>({todayStr} 기준)</div>
            </div>

            <div className={styles.inquiryBox}>
              <div className={styles.sectionHeader}>
                <div className={styles.border} />
                <h3>1:1 문의 내역</h3>
                <button
                  className={styles.moreButton}
                  onClick={() => router.push('/mypage/inquiry')} // ✅ 더보기 → 문의 목록 페이지
                >
                  더보기
                </button>
              </div>

              {inquiries.length === 0 ? (
                <div className={styles.inquiryTable}>
                  <span>문의 내역이 없습니다.</span>
                </div>
              ) : (
                inquiries.map((inquiry) => (
                  <div key={inquiry.id} className={styles.inquiryTable}>
                    <span className={styles.answerBox}>
                      {inquiry.state === '답변완료' ? '답변완료' : '처리중'}
                    </span>
                    <div className={styles.inquiryInfo}>
                      <span>{inquiry.title}</span>
                      <span>{new Date(inquiry.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
