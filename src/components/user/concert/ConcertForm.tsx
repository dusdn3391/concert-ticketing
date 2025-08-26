import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

import ConcertCard from '@/components/user/concert/ConcertCard';
import Pagination from '@/components/user/common/Pagination';
import styles from './Concert.module.css';

type Concert = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  rating: number;
  thumbNailImageUrl: string; // ✅ 최종 절대 URL
};

const API_BASE = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL;

function buildImageUrlForceThumbnailBase(imagePath: string): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${API_BASE}${imagePath}`;
}

// 서버 응답 → 화면에서 쓰기 좋게 정규화 (+ 디버그 로그)
function normalizeConcert(item: any): Concert {
  const images = Array.isArray(item.images) ? item.images : [];

  // 디버그: 원본 images 배열 테이블로 출력
  if (images.length > 0) {
    console.groupCollapsed(`🖼️ [IMG] item#${item.id} images`);
    console.table(
      images.map((img: any, idx: number) => ({
        idx,
        id: img?.id,
        role: img?.imagesRole ?? img?.role,
        image: img?.image ?? null,
        imageUrl: img?.imageUrl ?? null,
      })),
    );
    console.groupEnd();
  } else {
    console.log(`🖼️ [IMG] item#${item.id} images: (없음)`);
  }

  const thumbFromImages =
    images.find(
      (img: any) =>
        (img?.imagesRole || img?.role) === 'THUMBNAIL' && (img?.image || img?.imageUrl),
    )?.image ||
    images.find(
      (img: any) =>
        (img?.imagesRole || img?.role) === 'THUMBNAIL' && (img?.image || img?.imageUrl),
    )?.imageUrl;

  // 2) 그 외 백업 필드들
  const rawThumb =
    thumbFromImages ??
    item.thumbNailImageUrl ??
    item.thumbnailImageUrl ??
    item.thumbnailUrl ??
    item.imageUrl ??
    item.image ?? // 혹시 단일 필드로 들어오는 경우
    '';

  const finalUrl = buildImageUrlForceThumbnailBase(rawThumb);

  return {
    id: Number(item.id),
    title: String(item.title ?? ''),
    startDate: String(item.startDate ?? ''),
    endDate: String(item.endDate ?? ''),
    location: String(item.location ?? ''),
    rating: Number(item.rating ?? 0),
    thumbNailImageUrl: finalUrl,
  };
}

function extractListAndPages(data: any, perPage: number) {
  const listRaw =
    (Array.isArray(data) && data) || data?.content || data?.data || data?.items || [];

  const list: Concert[] = (listRaw as any[]).map(normalizeConcert);

  const totalPages =
    Number(data?.totalPages) ||
    (Array.isArray(listRaw) ? Math.max(1, Math.ceil(listRaw.length / perPage)) : 1);

  return { list, totalPages };
}

export default function ConcertPage() {
  const router = useRouter();

  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const perPage = 9;

  const fetchConcerts = async (page: number) => {
    try {
      const size = perPage;
      const url = `${API_BASE}/api/concerts`;

      console.log('📥 GET:', url, { page, size });

      const response = await fetch(url, {
        headers: { Accept: '*/*' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      console.groupCollapsed('🧾 서버 응답 프리뷰');
      const preview = Array.isArray(data)
        ? data.slice(0, 3)
        : Array.isArray(data?.content)
          ? data.content.slice(0, 3)
          : data;
      console.dir(preview);
      console.groupEnd();

      const { list, totalPages } = extractListAndPages(data, perPage);

      setConcerts(list);
      setTotalPages(totalPages);

      // 최종 카드에 들어갈 URL 테이블
      console.groupCollapsed('🎟 콘서트 목록(정규화 결과, 최종 썸네일 URL)');
      console.table(
        list.map((c) => ({ id: c.id, title: c.title, thumb: c.thumbNailImageUrl })),
      );
      console.groupEnd();
    } catch (err) {
      console.error('콘서트 불러오기 실패:', err);
      setConcerts([]);
      setTotalPages(1);
    }
  };

  useEffect(() => {
    fetchConcerts(currentPage);
  }, [currentPage]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>콘서트</h1>

      {/* 콘서트 리스트 */}
      <div className={styles.list}>
        {concerts.map((concert) => (
          <ConcertCard key={concert.id} concert={concert} />
        ))}
      </div>

      {/* 페이징 */}
      {concerts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
