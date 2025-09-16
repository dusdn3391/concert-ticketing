import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { ConcertDetail as ConcertDetailType } from '@/types/concert';
import { apiCall } from '@/lib/api';
import styles from './concertDetail.module.css';

interface ConcertDetailProps {
  concertId: string;
}

// ====== 환경/공통 ======
const API_BASE = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL || 'http://localhost:8080';

// ====== SVG 이미지 경로 선택 ======
function pickSvgImagePath(images?: any[] | null): string | null {
  if (!Array.isArray(images)) return null;
  const svg = images.find(
    (it) => (it?.imagesRole ?? it?.role ?? it?.images_role) === 'SVG_IMAGE',
  );
  if (!svg) return null;
  const p = String(svg.image || svg.imageUrl || '');
  const absolute = /^https?:\/\//i.test(p)
    ? p
    : `${API_BASE}${p.startsWith('/') ? '' : '/'}${p}`;
  return absolute;
}

async function fetchSvgMarkupWithAuth(url: string): Promise<string> {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`SVG 로드 실패 (${res.status})`);
  const blob = await res.blob();
  return await blob.text();
}

// ====== SVG/해시 유틸 ======
const BASE_FILL = 'rgba(59, 130, 246, 0.7)';
const HOVER_FILL = 'rgba(59, 130, 246, 0.85)';
const STROKE = 'rgba(0, 0, 0, 0.3)';

function setBaseFill(el: Element, color: string) {
  (el as HTMLElement).dataset.baseFill = color;
  el.setAttribute('fill', color);
}
function getBaseFill(el: Element) {
  return (el as HTMLElement).dataset.baseFill || el.getAttribute('fill') || '';
}
function hasTextInside(el: Element) {
  return (
    el.tagName.toLowerCase() === 'text' ||
    !!el.querySelector('text') ||
    !!el.closest('text')
  );
}

const normalizeNum = (v: string) =>
  v
    .replace(/-?\d+(\.\d+)?/g, (m) => {
      const n = Number(m);
      return Number.isNaN(n) ? m : (Math.round(n * 1000) / 1000).toString();
    })
    .replace(/\s+/g, ' ')
    .trim();

function getElementSignature(el: Element, rootSvg?: SVGSVGElement): string {
  const tag = el.tagName.toLowerCase();
  const get = (name: string) => el.getAttribute(name) ?? '';
  const viewBox = rootSvg?.getAttribute('viewBox') ?? '';

  const attrs: Record<string, string> = { transform: get('transform') };
  if (tag === 'path') attrs.d = get('d');
  if (tag === 'polygon' || tag === 'polyline') attrs.points = get('points');
  if (tag === 'rect') {
    attrs.x = get('x');
    attrs.y = get('y');
    attrs.width = get('width');
    attrs.height = get('height');
    attrs.rx = get('rx');
    attrs.ry = get('ry');
  }
  if (tag === 'circle') {
    attrs.cx = get('cx');
    attrs.cy = get('cy');
    attrs.r = get('r');
  }
  if (tag === 'ellipse') {
    attrs.cx = get('cx');
    attrs.cy = get('cy');
    attrs.rx = get('rx');
    attrs.ry = get('ry');
  }

  const parts = Object.keys(attrs)
    .sort()
    .map((k) => `${k}:${normalizeNum(attrs[k])}`)
    .join('|');

  return `tag:${tag}|vb:${viewBox}|${parts}`;
}
function hashString(s: string): string {
  let h1 = 0x811c9dc5,
    h2 = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 ^= c;
    h1 = (h1 * 16777619) >>> 0;
    h2 += c;
    h2 = (h2 * 2246822519) >>> 0;
  }
  return (h1.toString(16) + h2.toString(16)).slice(0, 12);
}
function getElementHash(el: Element, rootSvg: SVGSVGElement) {
  const sig = getElementSignature(el, rootSvg);
  return hashString(sig);
}
function makeStableZoneId(el: Element, rootSvg: SVGSVGElement, prefix = 'zone') {
  const signature = getElementSignature(el, rootSvg);
  const hash = hashString(signature);
  const id = `${prefix}_${hash}`;
  return { id, signature, hash };
}

type TempZone = {
  id: string;
  name: string;
  hash: string;
  svgElementId: string;
  seatCount: number;
  priceRange: { min: number; max: number };
};

// ====== 가격 프롬프트 유틸 (단일 가격) ======
function promptSinglePrice(init?: number): number | null {
  const s = window.prompt(
    '구역 가격(원)을 입력하세요 (숫자만)',
    init !== undefined ? String(init) : '50000',
  );
  if (s === null) return null; // 취소
  const v = Number(String(s).replace(/[, ]/g, ''));
  if (!Number.isFinite(v) || v < 0) {
    alert('가격은 0 이상의 숫자로 입력해주세요.');
    return null;
  }
  return v;
}

// ===== 스케줄 유틸 (concertTime 그대로 보냄) =====
function ensureYYYYMMDDTHHMMSS(s?: string | null): string {
  if (!s) return '';
  // 타임존 표기(Z, +09:00 등)는 제거해서 LocalDateTime 파싱에 안전하게
  const noZone = s.replace(/[Zz]|([+\-]\d{2}:\d{2})$/, '');
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(noZone)) return noZone;
  const m = noZone.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/);
  return m ? `${m[1]}T${m[2]}:${m[3]}:00` : noZone;
}

function buildScheduleRequestsFromRawSchedules(
  raw: any,
): Array<{ id: number; concertTime: string }> {
  const list = Array.isArray(raw?.schedules) ? raw.schedules : [];
  return list.map((s: any, idx: number) => {
    // 우선순위: concertTime > (date+startTime) > startTime
    const rawTime =
      s?.concertTime ??
      (s?.date && s?.startTime ? `${s.date}T${s.startTime}` : (s?.startTime ?? ''));
    return {
      id: Number(s?.id ?? idx),
      concertTime: ensureYYYYMMDDTHHMMSS(String(rawTime || '')),
    };
  });
}

export default function ConcertDetail({ concertId }: ConcertDetailProps) {
  const [concert, setConcert] = useState<ConcertDetailType | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [tempZones, setTempZones] = useState<TempZone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [svgFile, setSvgFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [svgTransform, setSvgTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [derivedZones, setDerivedZones] = useState<any[]>([]);

  const svgContainerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  const rawDetailRef = React.useRef<any>(null);

  // ====== GET ======
  const normalizeDetail = (raw: any): ConcertDetailType => {
    const createdAt = raw.created_at ?? raw.createdAt ?? null;
    const updatedAt = raw.updated_at ?? raw.updatedAt ?? null;

    return {
      id: raw.id,
      title: raw.title ?? '',
      description: raw.description ?? '',
      location: raw.location ?? '',
      rating: Number(raw.rating ?? 0),

      locationX: raw.locationX ?? raw.location_x ?? null,
      locationY: raw.locationY ?? raw.location_y ?? null,

      startDate: raw.startDate ?? raw.start_date ?? '',
      endDate: raw.endDate ?? raw.end_date ?? '',
      reservationStartDate:
        raw.reservationStartDate ?? raw.reservation_start_date ?? null,
      reservationEndDate: raw.reservationEndDate ?? raw.reservation_end_date ?? null,

      created_at: createdAt ?? undefined,
      updated_at: updatedAt ?? undefined,

      total_seats: raw.total_seats ?? raw.totalSeats ?? 0,
      review_count: raw.review_count ?? raw.reviewCount ?? 0,

      concertHallName: raw.concertHallName ?? null,
      schedules: raw.schedules ?? [],
      casts: raw.casts ?? [],

      svg_content: raw.svg_content ?? raw.svgContent ?? null,
      zones: raw.zones ?? [],

      ...(raw as any),
    } as ConcertDetailType;
  };

  const fetchConcertDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiCall(`/api/concerts/${concertId}`, { method: 'GET' });
      const raw = (data?.concert ?? data) as any;
      rawDetailRef.current = raw;

      const normalized = normalizeDetail(raw);
      setConcert(normalized);

      if (!normalized.svg_content) {
        const svgUrl = pickSvgImagePath(raw?.images);
        if (svgUrl) {
          try {
            const svgText = await fetchSvgMarkupWithAuth(svgUrl);
            setConcert((prev) => (prev ? { ...prev, svg_content: svgText } : prev));
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '콘서트 정보를 불러오는데 실패했습니다.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (concertId) fetchConcertDetail();
  }, [concertId]);

  // ====== 편집 진입: 기존 구역을 tempZones로 시딩 ======
  const enterEditMode = () => {
    if (!concert) return;

    const serverZones = Array.isArray(concert.zones) ? concert.zones : [];
    const base =
      serverZones.length > 0
        ? serverZones
        : (concert as any).seatSections || derivedZones;

    const tz: TempZone[] = (base || []).map((z: any) => ({
      id: z.svgElementId || z.id || `zone_${z.colorCode || z.hash || ''}`,
      name: z.name || z.sectionName || `구역`,
      hash: z.colorCode || z.hash || '',
      svgElementId: z.svgElementId || z.id || `zone_${z.colorCode || z.hash || ''}`,
      seatCount: Number(z.seatCount ?? z.seats?.length ?? 0),
      priceRange: {
        min: Number(z.priceRange?.min ?? z.price ?? 0),
        max: Number(z.priceRange?.max ?? z.price ?? 0),
      },
    }));

    try {
      const root = svgContainerRef.current?.querySelector('svg') as SVGSVGElement | null;
      if (root) {
        tz.forEach((z) => {
          if (!z.hash) {
            const el =
              root.querySelector(`#${z.svgElementId}`) ||
              root.querySelector(`[data-zone-key="${z.svgElementId}"]`);
            if (el) {
              z.hash = getElementHash(el, root);
            }
          }
        });
      }
    } catch {
      /* ignore */
    }

    const seen = new Set<string>();
    const unique = tz.filter((z) => {
      const key = z.hash || z.svgElementId;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    setTempZones(unique);
    setIsEditMode(true);
  };

  // ====== 저장 (수정 PUT) ======
  const handleSaveZones = async () => {
    if (!concert) return;

    try {
      const token = localStorage.getItem('admin_token');
      const raw = rawDetailRef.current ?? concert;

      const seatSections = (tempZones as TempZone[]).map((z, idx) => ({
        id: idx,
        sectionName: z.name || '',
        colorCode: z.hash || '',
        price: Number(z.priceRange?.min ?? 0),
        seats: [] as Array<{
          id: number;
          rowName: string;
          seatNumber: string;
          price: string;
        }>,
      }));

      const concertRequest = {
        id: Number(raw.id ?? 0),
        title: raw.title ?? '',
        description: raw.description ?? '',
        location: raw.location ?? '',
        locationX: Number(raw.locationX ?? 0),
        locationY: Number(raw.locationY ?? 0),
        startDate: raw.startDate ?? '',
        endDate: raw.endDate ?? '',
        reservationStartDate: raw.reservationStartDate ?? '',
        reservationEndDate: raw.reservationEndDate ?? '',
        price: raw.price ?? '',
        rating: Number(raw.rating ?? 0),
        limitAge: Number(raw.limitAge ?? 0),
        durationTime: Number(raw.durationTime ?? 0),
        adminId: Number(raw.adminId ?? 0),
        concertHallId: Number(raw.concertHallId ?? 0),
        concertTag: raw.concertTag ?? 'string',
        casts: Array.isArray(raw.casts) ? raw.casts : [],
      };

      // --- ✅ scheduleRequests: { id, concertTime }로 그대로 전송 ---
      const scheduleRequests = buildScheduleRequestsFromRawSchedules(raw);

      const seatMap = {
        id: 0,
        originalFileName: svgFile?.name ?? (concert.svg_content ? 'seatmap.svg' : ''),
        storedFileName: '',
      };

      const fd = new FormData();
      fd.append(
        'concertRequest',
        new Blob([JSON.stringify(concertRequest)], { type: 'application/json' }),
      );
      // fd.append(
      //   'scheduleRequests',
      //   new Blob([JSON.stringify(scheduleRequests)], { type: 'application/json' }),
      // );
      fd.append(
        'seatSections',
        new Blob([JSON.stringify(seatSections)], { type: 'application/json' }),
      );
      fd.append(
        'seatMap',
        new Blob([JSON.stringify(seatMap)], { type: 'application/json' }),
      );

      if (svgFile) {
        fd.append('svgImage', svgFile, svgFile.name);
      } else if (concert.svg_content) {
        const svgBlob = new Blob([concert.svg_content], { type: 'image/svg+xml' });
        fd.append('svgImage', svgBlob, 'seatmap.svg');
      } else {
        fd.append('svgImage', new Blob([]), '');
      }

      const url = `${API_BASE}/api/concerts/${concertId}`;

      const res = await fetch(url, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const rawText = await res.text().catch(() => '');
      if (!res.ok) {
        throw new Error(rawText || '콘서트 수정 실패');
      }

      setConcert((prev) =>
        prev
          ? ({
              ...prev,
              zones: tempZones.map((z) => ({
                id: z.svgElementId,
                name: z.name,
                svgElementId: z.svgElementId,
                seatCount: z.seatCount,
                priceRange: { ...z.priceRange },
              })),
              ...(prev as any),
            } as ConcertDetailType)
          : prev,
      );

      setIsEditMode(false);
      setSelectedZone(null);
      alert('구역 설정이 저장되었습니다.');
    } catch (error: any) {
      alert('구역 저장에 실패했습니다: ' + (error?.message || '알 수 없는 오류'));
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setTempZones([]);
    setSelectedZone(null);
    if (concert?.svg_content && svgContainerRef.current) {
      const svgEl = svgContainerRef.current.querySelector('svg');
      if (svgEl) {
        svgEl.querySelectorAll('[data-zone-configured]').forEach((element) => {
          element.removeAttribute('data-zone-configured');
          element.removeAttribute('data-name');
          element.setAttribute('fill', 'rgba(107, 114, 128, 0.3)');
          element.setAttribute('stroke', 'rgba(0, 0, 0, 0.3)');
          element.setAttribute('stroke-width', '1');
        });
      }
      renderSVG();
    }
  };

  // ====== 업로드 핸들러 ======
  const handleSVGUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'image/svg+xml') {
      alert('SVG 파일만 업로드 가능합니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const svg_content = reader.result as string;
      setConcert((prev) => (prev ? { ...prev, svg_content } : null));
      setSvgFile(file);
      setTempZones([]);
      setIsEditMode(true);
    };
    reader.readAsText(file);
  };

  // ====== 클릭: 편집 모드에서 이름/가격 설정 ======
  const handleSVGElementClick = (e: Event, element: Element) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isEditMode) return;

    const rootSvg = svgContainerRef.current?.querySelector('svg') as SVGSVGElement | null;
    if (!rootSvg || hasTextInside(element)) return;

    const hash = getElementHash(element, rootSvg);
    const idx = tempZones.findIndex((z) => z.hash === hash);

    if (idx >= 0) {
      const current = tempZones[idx];
      const newName = prompt('구역 이름 수정', current.name || '')?.trim();
      if (!newName) return;
      const newUnit = promptSinglePrice(current.priceRange.min);
      const next = [...tempZones];
      next[idx] = {
        ...current,
        name: newName,
        priceRange:
          newUnit === null ? current.priceRange : { min: newUnit, max: newUnit },
      };
      setTempZones(next);

      element.setAttribute('id', current.svgElementId || `zone_${hash}`);
      element.setAttribute('data-zone-key', current.svgElementId || `zone_${hash}`);
      element.setAttribute('data-zone-configured', 'true');
      setBaseFill(element, BASE_FILL);
      element.setAttribute('stroke', STROKE);
      element.setAttribute('stroke-width', '2');
      return;
    }

    const name = prompt('새 구역 이름을 입력하세요')?.trim();
    if (!name) return;

    const unit = promptSinglePrice();
    if (unit === null) return;

    const { id: stableId } = makeStableZoneId(element, rootSvg);
    element.setAttribute('id', stableId);
    element.setAttribute('data-zone-key', stableId);
    element.setAttribute('data-zone-configured', 'true');
    setBaseFill(element, BASE_FILL);
    element.setAttribute('stroke', STROKE);
    element.setAttribute('stroke-width', '2');

    setTempZones((prev) => [
      ...prev,
      {
        id: stableId,
        name,
        hash,
        svgElementId: stableId,
        seatCount: 0,
        priceRange: { min: unit, max: unit },
      },
    ]);
  };

  // ====== SVG 이동/확대 ======
  const [, /* unused */ setUnused] = useState(false); // to avoid lint for handlers closuring stale state (optional)

  const handleZoom = (delta: number, centerX?: number, centerY?: number) => {
    setSvgTransform((prev) => {
      const newScale = Math.max(0.1, Math.min(5, prev.scale + delta));
      if (centerX !== undefined && centerY !== undefined) {
        const scaleRatio = newScale / prev.scale;
        const newX = centerX - (centerX - prev.x) * scaleRatio;
        const newY = centerY - (centerY - prev.y) * scaleRatio;
        return { x: newX, y: newY, scale: newScale };
      }
      return { ...prev, scale: newScale };
    });
  };
  const handleZoomIn = () => handleZoom(0.2);
  const handleZoomOut = () => handleZoom(-0.2);
  const handleZoomReset = () => setSvgTransform({ x: 0, y: 0, scale: 1 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditMode) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - svgTransform.x, y: e.clientY - svgTransform.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isEditMode) return;
    setSvgTransform((prev) => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleWheel = (e: React.WheelEvent) => {
    if (!e.shiftKey) return;
    e.preventDefault();
    const rect = svgWrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta, centerX, centerY);
  };

  // ====== 렌더링 ======
  const renderSVG = () => {
    if (!concert?.svg_content || !svgContainerRef.current) return;

    svgContainerRef.current.innerHTML = concert.svg_content;
    const svgEl = svgContainerRef.current.querySelector('svg');

    if (!svgEl) return;
    const newSvgEl = svgEl.cloneNode(true) as SVGElement;
    svgEl.parentNode?.replaceChild(newSvgEl, svgEl);

    if (isEditMode) {
      const root = newSvgEl as unknown as SVGSVGElement;

      root
        .querySelectorAll('polygon, rect, path, circle, ellipse, g, polyline')
        .forEach((el) => {
          if (hasTextInside(el)) return;

          const elHash = getElementHash(el, root);
          const tz = tempZones.find((z) => z.hash === elHash);

          if (tz) {
            el.setAttribute('id', tz.svgElementId || `zone_${tz.hash}`);
            el.setAttribute('data-zone-key', tz.svgElementId || `zone_${tz.hash}`);
            el.setAttribute('data-zone-configured', 'true');
            setBaseFill(el, BASE_FILL);
            el.setAttribute('stroke', STROKE);
            el.setAttribute('stroke-width', '2');
            (el as HTMLElement).style.cursor = 'pointer';

            el.addEventListener('click', (e) =>
              handleSVGElementClick(e as unknown as Event, el),
            );
            el.addEventListener('mouseenter', () => el.setAttribute('fill', HOVER_FILL));
            el.addEventListener('mouseleave', () =>
              el.setAttribute('fill', getBaseFill(el)),
            );
            return;
          }

          setBaseFill(el, 'rgba(107, 114, 128, 0.3)');
          el.setAttribute('stroke', STROKE);
          el.setAttribute('stroke-width', '1');
          (el as HTMLElement).style.cursor = 'pointer';

          el.addEventListener('click', (e) =>
            handleSVGElementClick(e as unknown as Event, el),
          );
          el.addEventListener('mouseenter', () => el.setAttribute('opacity', '0.8'));
          el.addEventListener('mouseleave', () => el.setAttribute('opacity', '1'));
        });
    } else {
      const sections = Array.isArray((concert as any).seatSections)
        ? (concert as any).seatSections
        : [];
      const hasServerZones = Array.isArray(concert.zones) && concert.zones.length > 0;

      if (!hasServerZones && sections.length > 0) {
        const colorMap = new Map<string, any>();
        sections.forEach((s: any) => {
          if (s?.colorCode) colorMap.set(String(s.colorCode), s);
        });

        const matchedZones: any[] = [];
        const root = newSvgEl as unknown as SVGSVGElement;

        newSvgEl
          .querySelectorAll('polygon, rect, path, circle, ellipse, polyline, g')
          .forEach((element) => {
            if (hasTextInside(element)) return;

            const hash = getElementHash(element, root);
            const section = colorMap.get(hash);
            if (!section) return;

            const zoneId = `zone_${hash}`;
            element.setAttribute('id', zoneId);
            element.setAttribute('data-zone-key', zoneId);
            element.setAttribute('data-zone-configured', 'true');
            setBaseFill(element, BASE_FILL);
            element.setAttribute('stroke', STROKE);
            element.setAttribute('stroke-width', '1');
            (element as HTMLElement).style.cursor = 'pointer';

            element.addEventListener('click', () => setSelectedZone(zoneId));
            element.addEventListener('mouseenter', () =>
              element.setAttribute('fill', HOVER_FILL),
            );
            element.addEventListener('mouseleave', () => {
              if (selectedZone !== zoneId) {
                element.setAttribute('fill', BASE_FILL);
              }
            });

            matchedZones.push({
              id: zoneId,
              name: section.sectionName ?? `구역 ${hash.slice(0, 4)}`,
              svgElementId: zoneId,
              priceRange: {
                min: Number(section.price ?? 0),
                max: Number(section.price ?? 0),
              },
              seatCount: Array.isArray(section.seats) ? section.seats.length : 0,
              colorCode: hash,
            });
          });

        setDerivedZones(matchedZones);
      }

      concert.zones?.forEach((zone: any) => {
        const element =
          newSvgEl.querySelector(`#${zone.svgElementId}`) ||
          newSvgEl.querySelector(`[data-zone-key="${zone.svgElementId}"]`);
        if (element) {
          const clickHandler = () => setSelectedZone(zone.id);
          element.addEventListener('click', clickHandler);

          element.addEventListener('mouseenter', () => {
            element.setAttribute('fill', BASE_FILL);
            (element as HTMLElement).style.cursor = 'pointer';
          });
          element.addEventListener('mouseleave', () => {
            if (selectedZone !== zone.id) {
              element.setAttribute('fill', 'rgba(107, 114, 128, 0.5)');
            }
          });

          element.setAttribute(
            'fill',
            selectedZone === zone.id ? BASE_FILL : 'rgba(107, 114, 128, 0.5)',
          );
          element.setAttribute('stroke', STROKE);
          element.setAttribute('stroke-width', '1');
        }
      });
    }
  };

  useEffect(() => {
    renderSVG();
  }, [concert, selectedZone, isEditMode, tempZones]);

  // ====== 뷰 ======
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>콘서트 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>❌</div>
          <h3>오류가 발생했습니다</h3>
          <p>{error}</p>
          <div className={styles.errorActions}>
            <button onClick={fetchConcertDetail} className={styles.retryButton}>
              다시 시도
            </button>
            <Link href='/admin/concerts' className={styles.backButton}>
              콘서트 목록으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!concert) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>🎵</div>
          <h3>콘서트를 찾을 수 없습니다</h3>
          <p>요청한 콘서트가 존재하지 않거나 삭제되었습니다.</p>
          <Link href='/admin/concerts' className={styles.backButton}>
            콘서트 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const selectedZoneData = concert.zones?.find((zone: any) => zone.id === selectedZone);
  const displayZones = isEditMode
    ? tempZones
    : concert.zones && concert.zones.length > 0
      ? concert.zones
      : derivedZones;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href='/admin/concerts' className={styles.backButton}>
            ← 목록으로
          </Link>
          <div>
            <h1 className={styles.title}>{concert.title}</h1>
            <p className={styles.subtitle}>{concert.location}</p>
            {concert.description && (
              <p className={styles.description}>{concert.description}</p>
            )}
          </div>
        </div>
        <div className={styles.headerRight}>
          <Link
            href={{ pathname: '/admin/concerts/edit', query: { id: concertId } }}
            className={styles.EditButton}
          >
            콘서트 정보 수정
          </Link>
          <Link
            href={`/admin/concerts/${concertId}/preview`}
            className={styles.previewButton}
          >
            전체 미리보기
          </Link>
          <Link
            href={`/admin/concerts/${concertId}/zones`}
            className={styles.manageButton}
          >
            구역 관리
          </Link>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.svgSection}>
          <div className={styles.svgHeader}>
            <div className={styles.svgHeaderLeft}>
              <h2>공연장 레이아웃</h2>
              {isEditMode ? (
                <p>SVG 도형을 클릭해 구역을 추가/이름·가격을 수정하세요 (텍스트 제외)</p>
              ) : concert.svg_content ? (
                <p>Shift + 휠로 확대/축소, 드래그로 이동 가능합니다</p>
              ) : (
                <p>SVG 파일을 업로드하여 공연장 레이아웃을 설정하세요</p>
              )}
            </div>
            <div className={styles.svgActions}>
              {!concert.svg_content ? (
                <label className={styles.uploadButton}>
                  📁 SVG 업로드
                  <input
                    type='file'
                    accept='.svg'
                    onChange={handleSVGUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              ) : isEditMode ? (
                <div className={styles.editActions}>
                  <button onClick={handleCancelEdit} className={styles.cancelButton}>
                    취소
                  </button>
                  <button onClick={handleSaveZones} className={styles.saveButton}>
                    저장
                  </button>
                </div>
              ) : (
                <div className={styles.normalActions}>
                  <div className={styles.zoomControls}>
                    <button
                      onClick={handleZoomOut}
                      className={styles.zoomButton}
                      title='축소'
                    >
                      ➖
                    </button>
                    <button
                      onClick={handleZoomIn}
                      className={styles.zoomButton}
                      title='확대'
                    >
                      ➕
                    </button>
                    <button
                      onClick={handleZoomReset}
                      className={styles.zoomButton}
                      title='원본'
                    >
                      🔄
                    </button>
                  </div>
                  <label className={styles.reuploadButton}>
                    🔄 SVG 다시 업로드
                    <input
                      type='file'
                      accept='.svg'
                      onChange={handleSVGUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button onClick={enterEditMode} className={styles.editButton}>
                    ✏️ 구역 편집
                  </button>
                </div>
              )}
            </div>
          </div>

          {concert.svg_content ? (
            <div className={styles.svgWrapper}>
              <div
                ref={svgWrapperRef}
                className={styles.svgViewport}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                  cursor: isDragging ? 'grabbing' : isEditMode ? 'default' : 'grab',
                  overflow: 'hidden',
                  position: 'relative',
                  height: '600px',
                  border: '1px solid var(--border-secondary)',
                }}
              >
                <div
                  ref={svgContainerRef}
                  className={styles.svgContainer}
                  style={{
                    transform: `translate(${svgTransform.x}px, ${svgTransform.y}px) scale(${svgTransform.scale})`,
                    transformOrigin: '0 0',
                    transition: isDragging ? 'none' : 'transform 0.2s ease',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                />
              </div>

              {isEditMode && (
                <div className={styles.editHint}>
                  💡 이미 선택된 구역(파란색)은 클릭하면 이름/가격을 수정합니다. 회색
                  도형을 클릭하면 새 구역으로 추가됩니다.
                </div>
              )}
              {!isEditMode && concert.svg_content && (
                <div className={styles.controlHints}>
                  <div className={styles.zoomInfo}>
                    확대/축소: {Math.round(svgTransform.scale * 100)}%
                  </div>
                  <div className={styles.controlHint}>
                    💡 Shift + 휠: 확대/축소 | 드래그: 이동
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.noSvg}>
              <div className={styles.noSvgIcon}>🏗️</div>
              <h3>SVG 레이아웃이 없습니다</h3>
              <p>공연장 도면 SVG 파일을 업로드하여 레이아웃을 설정하세요</p>
            </div>
          )}
        </div>

        <div className={styles.infoPanel}>
          <h2>구역 정보</h2>

          {selectedZoneData && !isEditMode ? (
            <div className={styles.zoneDetail}>
              <div className={styles.zoneHeader}>
                <h3>{selectedZoneData.name}</h3>
                <div className={styles.zoneActions}>
                  <Link
                    href={`/admin/concerts/${concertId}/zones/${selectedZoneData.id}`}
                    className={styles.detailButton}
                  >
                    상세보기
                  </Link>
                  <Link
                    href={`/admin/concerts/${concertId}/zones/${selectedZoneData.id}/editor`}
                    className={styles.editButton}
                  >
                    좌석 편집
                  </Link>
                </div>
              </div>
              <div className={styles.zoneStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>좌석 수</span>
                  <span className={styles.statValue}>{selectedZoneData.seatCount}석</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>가격 범위</span>
                  <span>가격: {selectedZoneData.price.toLocaleString()}원</span>
                </div>
              </div>
            </div>
          ) : isEditMode ? (
            <div className={styles.editModeInfo}>
              <h3>🔧 구역 편집 모드</h3>
              <p>파란색=선택됨(이름/가격 수정), 회색=미선택(추가)</p>
              <div className={styles.tempZoneCount}>
                설정된 구역: {tempZones.length}개
              </div>
              <div className={styles.inputHint}>
                저장 시 이미지/메타/좌석섹션이 함께 전송됩니다.
              </div>
            </div>
          ) : (
            <div className={styles.noSelection}>
              <p>구역을 선택해주세요</p>
            </div>
          )}

          {displayZones.length > 0 && (
            <div className={styles.zoneList}>
              <h3>{isEditMode ? '설정 중인 구역' : '전체 구역'}</h3>
              <div className={styles.zones}>
                {displayZones.map((zone: any) => (
                  <div
                    key={zone.id}
                    className={`${styles.zoneCard} ${
                      selectedZone === zone.id ? styles.selected : ''
                    } ${isEditMode ? styles.editMode : ''}`}
                    onClick={() => !isEditMode && setSelectedZone(zone.id)}
                  >
                    <div className={styles.zoneCardHeader}>
                      <h4>{zone.name}</h4>
                      {!isEditMode && (
                        <span className={styles.seatCount}>{zone.seatCount}석</span>
                      )}
                    </div>
                    {!isEditMode && (
                      <p className={styles.priceRange}>
                        {zone.priceRange.min.toLocaleString()}원 ~{' '}
                        {zone.priceRange.max.toLocaleString()}원
                      </p>
                    )}
                    {isEditMode && (
                      <p className={styles.zoneId}>
                        ID: {zone.svgElementId} · {zone.priceRange.min.toLocaleString()}~
                        {zone.priceRange.max.toLocaleString()}원
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {!isEditMode && (
        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <h3>공연장 정보</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>생성일</span>
                <span className={styles.infoValue}>{concert.created_at ?? '-'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>수정일</span>
                <span className={styles.infoValue}>{concert.updated_at ?? '-'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>총 좌석 수</span>
                <span className={styles.infoValue}>{concert.total_seats ?? 0}석</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>총 구역 수</span>
                <span className={styles.infoValue}>
                  {(concert.zones?.length || derivedZones.length) ?? 0}개
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>평점</span>
                <span className={styles.infoValue}>{concert.rating}/5</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>리뷰 수</span>
                <span className={styles.infoValue}>{concert.review_count ?? 0}개</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
