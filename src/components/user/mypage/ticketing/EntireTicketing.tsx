import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import Pagination from '@/components/user/common/Pagination';
import MypageNav from '../MypageNav';
import styles from './Ticketing.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL || 'http://localhost:8080';

type SeatReservation = {
  id: number;
  rowName: string;
  seatNumber: number;
  seatReservationState: 'AVAILABLE' | 'UNAVAILABLE' | string;
};

type ImageItem = {
  id: number;
  image?: string; // "/uploads/....png"
  imageUrl?: string; // 혹시 다른 키로 올 수도 있음
  imagesRole?: string; // "THUMBNAIL"
  role?: string;
  images_role?: string;
};

type ConcertLite = {
  id: number;
  title: string;
  description?: string;
  images?: ImageItem[];
  concertHallName?: string | null;
  location?: string | null;
};

type ReserveItem = {
  id: number; // 예약(예매) ID
  status?: string; // 백엔드에서 내려올 수도 있음
  state?: string; // ✅ CANCELLED 등
  concert?: ConcertLite;
  concertHallName?: string | null;
  location?: string | null;
  concertScheduleDate?: string; // 관람 일시
  seats?: any[];
  seatReservations?: SeatReservation[];
  images?: ImageItem[]; // 혹시 상위에 올 수도 있으니 대비
};

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // 0-base
};

const ITEMS_PER_PAGE = 3;

/* ========== 이미지 유틸 ========== */
const toAbsolute = (p?: string | null) => {
  if (!p) return null;
  return /^https?:\/\//i.test(p) ? p : `${API_BASE}${p.startsWith('/') ? '' : '/'}${p}`;
};

const pickThumbnailUrl = (images?: ImageItem[] | null): string | null => {
  if (!images || images.length === 0) return null;
  const roleKey = (it: ImageItem) => it.imagesRole ?? it.role ?? it.images_role;
  const thumb = images.find((it) => roleKey(it) === 'THUMBNAIL') || images[0];
  const path = thumb.image ?? thumb.imageUrl ?? null;
  return toAbsolute(path);
};

export default function Ticketing() {
  const router = useRouter();

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  }, []);

  const [rows, setRows] = useState<ReserveItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null); // ✅ 취소 중 표시

  /* ========== 표시 유틸 ========== */
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

  const extractConcertName = (r: ReserveItem) => r.concert?.title ?? '콘서트';
  const extractHall = (r: ReserveItem) =>
    r.concertHallName ??
    r.concert?.concertHallName ??
    r.concert?.location ??
    r.location ??
    '공연장';
  const extractDateTime = (r: ReserveItem) => fmtDateTime(r.concertScheduleDate);
  const extractReservationNumber = (r: ReserveItem) => String(r.id);

  const extractSeatLabel = (r: ReserveItem) => {
    const seatsArr =
      (Array.isArray(r.seatReservations) && r.seatReservations) ||
      (Array.isArray(r.seats) && r.seats) ||
      [];
    return `좌석(${seatsArr.length})`;
  };

  const isReviewWindow = (r: ReserveItem) => {
    if (!r.concertScheduleDate) return false;
    const now = new Date();
    const start = new Date(r.concertScheduleDate);
    return !isNaN(start.getTime()) && start.getTime() < now.getTime();
  };

  const extractPosterUrl = (r: ReserveItem) =>
    pickThumbnailUrl(r.concert?.images) || pickThumbnailUrl(r.images) || null;

  /* ========== 취소 상태/가능 여부 ========== */
  const isCancelled = (r: ReserveItem) => {
    const s = (r.state ?? r.status ?? '').toUpperCase();
    return s === 'CANCELLED' || s === 'CANCELED' || s.includes('CANCEL');
  };

  const extractStatus = (r: ReserveItem) =>
    isCancelled(r)
      ? '취소완료'
      : (r.status ??
        (Array.isArray(r.seatReservations) && r.seatReservations.length > 0
          ? '예약완료'
          : '-'));

  const canCancel = (r: ReserveItem) => {
    if (isCancelled(r)) return false;
    if (!r.concertScheduleDate) return true;
    const start = new Date(r.concertScheduleDate);
    return !isNaN(start.getTime()) && start.getTime() > Date.now(); // 공연 시작 전
  };

  /* ========== API 호출 ========== */
  const fetchReserves = async (page1Base: number) => {
    setLoading(true);
    setErrMsg(null);
    try {
      const token = localStorage.getItem('accessToken');
      const url = `${API_BASE}/api/reserve?page=${page1Base - 1}&size=${ITEMS_PER_PAGE}`;

      const res = await fetch(url, {
        headers: {
          Accept: '*/*',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: PageResponse<ReserveItem> | ReserveItem[] = await res.json();
      if (Array.isArray(data)) {
        setRows(data);
        setTotalElements(data.length);
        setTotalPages(Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE)));
      } else {
        setRows(data.content ?? []);
        setTotalElements(
          typeof data.totalElements === 'number'
            ? data.totalElements
            : (data.content ?? []).length,
        );
        setTotalPages(data.totalPages ?? 1);
      }
    } catch (e: any) {
      setErrMsg(e?.message || '예매 내역 조회 중 오류가 발생했습니다.');
      setRows([]);
      setTotalElements(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReserves(currentPage);
  }, [currentPage]);

  /* ========== 핸들러들 ========== */
  const handleGoConcert = (concertId?: number) => {
    if (!concertId) {
      alert('공연 정보를 찾을 수 없습니다.');
      return;
    }
    router.push(`/concert/${concertId}`);
  };

  const handleCancel = async (reservationId: number) => {
    if (!reservationId) return;
    if (!confirm('정말 취소하시겠습니까?')) return;

    try {
      setCancelingId(reservationId);

      const token = localStorage.getItem('accessToken');
      const url = `${API_BASE}/api/reserve?reservationId=${reservationId}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          Accept: '*/*',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      await fetchReserves(currentPage); // 최신 상태로 갱신
      alert('예매가 취소되었습니다.');
    } catch (e: any) {
      alert(`취소 중 오류가 발생했습니다: ${e?.message ?? 'unknown error'}`);
    } finally {
      setCancelingId(null);
    }
  };

  /* ========== 상단 카운트(서버 값 없으므로 총건=작성, 미작성=0) ========== */
  const totalReviews = totalElements;
  const writtenReviews = totalElements;
  const unwrittenReviews = 0;

  return (
    <div className={styles.all}>
      <div className={styles.margin}>
        <div>
          <h1 className={styles.title}>마이페이지</h1>
        </div>
        <div className={styles.container}>
          <MypageNav />
          <section className={styles.content}>
            <div className={styles.reservation}>
              <div className={styles.reservationTitle}>예매확인</div>

              <div className={styles.reservationContent}>
                <div className={styles.reservationSearch}>
                  <div className={styles.reservationReview}>
                    <div className={styles.reservatonCount}>
                      사용자의 예매 건은 총{' '}
                      <span className={styles.highlight}>{totalReviews}</span>건 입니다. (
                      {today} 기준) / 관람후기 작성 {writtenReviews}건, 미작성{' '}
                      {unwrittenReviews}건
                    </div>
                  </div>

                  {/* (검색 UI는 비활성/유지) */}
                  <div className={styles.reservationDateSearchBox}>
                    <div className={styles.searchBoxTitle}>기간별</div>
                    <input type='text' placeholder='날짜' /> ~
                    <input type='text' placeholder='날짜' />
                    <button aria-label='검색' disabled>
                      조회
                    </button>
                  </div>
                  <div className={styles.reservationSearchBox}>
                    <div className={styles.searchBoxTitle}>콘서트명</div>
                    <input type='text' placeholder='concert-ticketing' />
                    <button aria-label='검색' disabled>
                      조회
                    </button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className={styles.loading}>로딩 중…</div>
              ) : errMsg ? (
                <div className={styles.error}>오류: {errMsg}</div>
              ) : rows.length === 0 ? (
                <div className={styles.empty}>예매 내역이 없습니다.</div>
              ) : (
                rows.map((ticket) => {
                  const posterUrl = extractPosterUrl(ticket);
                  return (
                    <div key={ticket.id} className={styles.tickets}>
                      <div className={styles.ticketTitle}>
                        {extractConcertName(ticket)}
                      </div>

                      <div className={styles.ticketInfos}>
                        <div className={styles.ticketPosterline}>
                          <div className={styles.ticketPoster}>
                            {posterUrl ? (
                              <img src={posterUrl} alt='포스터' className={styles.img} />
                            ) : (
                              '포스터'
                            )}
                          </div>
                        </div>

                        <div className={styles.ticketInfo}>
                          <div className={styles.infoRow}>
                            <span>예매번호: {extractReservationNumber(ticket)}</span>
                            <span>관람일시: {extractDateTime(ticket)}</span>
                          </div>
                          <div className={styles.infoRow}>
                            <span>예매상태: {extractStatus(ticket)}</span>
                            <span style={{ color: 'red' }}>
                              {extractSeatLabel(ticket)}
                            </span>
                          </div>
                          <div className={styles.infoRow}>
                            <span>콘서트장: {extractHall(ticket)}</span>
                            <span>
                              후기작성:{' '}
                              {isReviewWindow(ticket)
                                ? '작성 가능'
                                : '작성기간이 아닙니다'}
                            </span>
                          </div>
                        </div>

                        <div className={styles.ticketbutton}>
                          <button
                            className={styles.ticketButton}
                            onClick={() => handleGoConcert(ticket.concert?.id)}
                          >
                            콘서트정보
                          </button>

                          {/* ✅ state가 CANCELLED면 버튼 자체 숨김 */}
                          {!isCancelled(ticket) && (
                            <button
                              className={styles.ticketCancelButton}
                              onClick={() => handleCancel(ticket.id)}
                              disabled={!canCancel(ticket) || cancelingId === ticket.id}
                            >
                              {cancelingId === ticket.id ? '취소 중…' : '취소하기'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
