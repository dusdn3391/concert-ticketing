import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import styles from './Section.module.css';

type Review = {
  id: string;
  rating: number;
  text: string;
  date: string;
};

interface ReviewSectionProps {
  concertId: number; // ✅ 상위에서 전달
}

const API_BASE = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL;

export default function ReviewSection({ concertId }: ReviewSectionProps) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isInvalid = useMemo(() => !text.trim() || rating === 0, [text, rating]);

  // ✅ 서버 응답 → 화면용 Review로 매핑
  const mapServerReview = (r: any): Review => ({
    id: String(r.id ?? r.reviewId ?? `${Math.random()}`),
    rating: Number(r.rating ?? 0),
    text: String(r.content ?? r.text ?? ''),
    date: new Date(r.createdAt ?? r.created_at ?? Date.now()).toLocaleDateString(
      'ko-KR',
      { year: 'numeric', month: '2-digit', day: '2-digit' },
    ),
  });

  // ✅ 리뷰 목록 불러오기
  const fetchReviews = async () => {
    try {
      setLoadingList(true);
      setError(null);

      const url = `${API_BASE}/api/review/?concertId=${concertId}`;
      console.log('📥 GET reviews:', url);

      const res = await fetch(url, { headers: { accept: '*/*' } });
      const rawText = await res.text();
      if (!res.ok) throw new Error(`리뷰 조회 실패: ${res.status} ${rawText}`);

      let data: any = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (e) {
        console.warn('리뷰 응답 JSON 파싱 실패, 원문:', rawText);
        data = {};
      }

      // ✅ 새 응답 구조 대응
      const arr = Array.isArray(data.reviewByConcertIdReadResponses)
        ? data.reviewByConcertIdReadResponses
        : Array.isArray(data) // 혹시 API가 배열을 바로 줄 때 대비
          ? data
          : [];

      const list = arr.map(mapServerReview);
      setReviews(list);

      // 평균/총점(서버 제공) 반영
      if (typeof data.rating === 'number') setAvgRating(data.rating);
      else setAvgRating(null);

      console.groupCollapsed('🧾 리뷰 목록');
      console.table(list);
      console.groupEnd();
    } catch (e: any) {
      console.error('❌ 리뷰 조회 오류:', e?.message || e);
      setError(e?.message || '리뷰를 불러오지 못했습니다.');
      setReviews([]);
      setAvgRating(null);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (!concertId) return;
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concertId]);

  const handleStarClick = (index: number) => setRating(index + 1);
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (error) setError(null);
  };

  // ✅ 등록 → 성공 시 fetchReviews 재호출
  const handleRegister = async () => {
    if (isInvalid) return;

    try {
      setSubmitting(true);

      const payload = { concertId, rating, content: text.trim() };
      console.groupCollapsed('📝 리뷰 등록 요청');
      console.log('POST', `${API_BASE}/api/review/create`);
      console.table(payload as any);
      console.groupEnd();

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('로그인이 필요합니다.');
        return;
      }

      const res = await fetch(`${API_BASE}/api/review/create`, {
        method: 'POST',
        headers: {
          accept: '*/*',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const preview = await res.text();
      console.log('📩 리뷰 등록 응답:', preview.slice(0, 500));
      if (!res.ok) throw new Error(`등록 실패: ${res.status} ${preview}`);

      // 폼 리셋
      setText('');
      setRating(0);

      // ✅ 최신 목록 다시 조회
      await fetchReviews();
    } catch (e: any) {
      console.error('❌ 후기 등록 오류:', e?.message || e);
      setError(e?.message || '후기 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('로그인이 필요합니다.');
        return;
      }

      const url = `${API_BASE}/api/review/delete?reviewId=${id}`;
      console.log('🗑 DELETE review:', url);

      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          accept: '*/*',
          Authorization: `Bearer ${token}`,
        },
      });

      const preview = await res.text();
      console.log('📩 리뷰 삭제 응답:', preview.slice(0, 500));

      if (!res.ok) {
        throw new Error(`삭제 실패: ${res.status} ${preview}`);
      }

      await fetchReviews();
    } catch (e: any) {
      console.error('❌ 리뷰 삭제 오류:', e?.message || e);
      alert(e?.message || '리뷰 삭제 중 오류가 발생했습니다.');
    }
  };

  const stars = ['star1', 'star2', 'star3', 'star4', 'star5'];

  return (
    <div className={styles.wrap}>
      {/* 입력 영역 */}
      <div className={styles.inputSection}>
        <div className={styles.starArray}>
          {stars.map((id, i) => (
            <span
              key={id}
              onClick={() => handleStarClick(i)}
              className={`${styles.star} ${i < rating ? styles.active : ''}`}
            >
              ★
            </span>
          ))}
          <span>별을 선택해주세요</span>
        </div>

        <textarea
          placeholder='후기를 작성해주세요'
          className={styles.text}
          maxLength={1000}
          value={text}
          onChange={handleTextChange}
          disabled={submitting}
        />

        {error && <div className={styles.errorMsg}>{error}</div>}

        <div className={styles.count}>
          <span>{text.length} / 1000</span>
          <button
            className={styles.registerBtn}
            onClick={handleRegister}
            disabled={submitting || isInvalid}
            title={isInvalid ? '별점과 내용을 입력해 주세요' : '등록'}
          >
            {submitting ? '등록 중...' : '등록'}
          </button>
        </div>
      </div>

      {/* 등록된 리뷰 */}
      <div className={styles.reviewList}>
        {loadingList ? (
          <div className={styles.loading}>리뷰 불러오는 중...</div>
        ) : reviews.length === 0 ? (
          <div className={styles.empty}>아직 등록된 후기가 없습니다.</div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className={styles.reviewItem}>
              <div className={styles.reviewHeader}>
                <div className={styles.starArray}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={`${styles.star} ${i < review.rating ? styles.active : ''}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <span className={styles.reviewDate}>{review.date}</span>
              </div>
              <p className={styles.reviewText}>{review.text}</p>
              <button
                type='button'
                title='삭제'
                className={styles.deleteBtn}
                onClick={() => handleDelete(review.id)}
              >
                <Image
                  src='/icons/delete.png'
                  alt='삭제'
                  width={20}
                  height={20}
                  className={styles.delteImage}
                />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
