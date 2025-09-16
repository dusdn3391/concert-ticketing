import React, { useEffect, useMemo, useState } from 'react';

import styles from './Review.module.css';
import MypageNav from '../MypageNav';
import Pagination from '@/components/user/common/Pagination';

const API_BASE = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL || 'http://localhost:8080';

type ApiReview = {
  id: number;
  concertTitle?: string; // 백엔드가 이렇게 줄 수도 있고
  concertName?: string; // 혹은 이렇게 줄 수도 있고
  concert?: { title?: string }; // 객체 안에 있을 수도 있음
  content: string;
  createdAt?: string; // ISO 문자열 기대
  date?: string; // 혹시 date 라는 이름으로 올 수도 있음
};

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // 현재 페이지(0-base)
};

export default function Review() {
  const [currentPage, setCurrentPage] = useState(1); // UI는 1-base
  const pageSize = 10;

  const [rows, setRows] = useState<ApiReview[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  }, []);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalElements / pageSize));
  }, [totalElements, pageSize]);

  // 날짜 포맷 유틸
  const fmtDate = (v?: string) => {
    if (!v) return '';
    const dt = new Date(v);
    if (isNaN(dt.getTime())) return v;
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const extractConcertTitle = (r: ApiReview) =>
    r.concertTitle || r.concertName || r.concert?.title || '콘서트';

  const extractCreatedAt = (r: ApiReview) => fmtDate(r.createdAt || r.date || '');

  const fetchReviews = async (page1Base: number) => {
    setLoading(true);
    setErrMsg(null);
    try {
      const token = localStorage.getItem('accessToken');
      const url = `${API_BASE}/api/review/user?size=${pageSize}&page=${page1Base - 1}`;

      const res = await fetch(url, {
        headers: {
          Accept: '*/*',
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: PageResponse<ApiReview> | ApiReview[] = await res.json();

      // 페이지 응답 or 배열 응답 둘 다 대응
      if (Array.isArray(data)) {
        setRows(data);
        setTotalElements(data.length);
      } else {
        setRows(data.content ?? []);
        setTotalElements(
          typeof data.totalElements === 'number'
            ? data.totalElements
            : (data.content ?? []).length,
        );
      }
    } catch (e: any) {
      setErrMsg(e?.message || '후기 조회 중 오류가 발생했습니다.');
      setRows([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // 작성/미작성 집계(백엔드에서 미작성 건수를 주지 않으므로, 여기서는 작성=총건)
  const writtenReviews = totalElements;
  const totalReviews = totalElements;
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
            <div className={styles.review}>
              <div className={styles.reviewTitle}>후기관리</div>

              <div className={styles.reviewContent}>
                <div className={styles.reviewSearch}>
                  <div className={styles.reviewCount}>
                    사용자의 예매 건은 총{' '}
                    <span className={styles.highlight}>{totalReviews}</span>건 입니다. (
                    {today} 기준) / 관람후기 작성 {writtenReviews}건, 미작성{' '}
                    {unwrittenReviews}건
                  </div>
                  <div className={styles.restReview}>
                    <span>고객님께서 남겨주신 후기를 확인하실 수 있습니다.</span>
                    <span>
                      운영정책에 위반되거나, 후기의 맞지 않는 글은 고객님께 사전 통보없이
                      삭제될 수 있습니다.
                    </span>
                  </div>

                  {/* 🔻 검색 박스 제거 (요청사항) */}
                </div>
              </div>

              <div className={styles.reviewTableBox}>
                {loading ? (
                  <div className={styles.loading}>로딩 중…</div>
                ) : errMsg ? (
                  <div className={styles.error}>오류: {errMsg}</div>
                ) : rows.length === 0 ? (
                  <div className={styles.empty}>작성한 후기가 없습니다.</div>
                ) : (
                  <table className={styles.reviewTable}>
                    <thead>
                      <tr>
                        <th>콘서트명</th>
                        <th>후기내용</th>
                        <th>작성일시</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((review) => (
                        <tr key={review.id}>
                          <td>{extractConcertTitle(review)}</td>
                          <td>{review.content}</td>
                          <td>{extractCreatedAt(review)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

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
