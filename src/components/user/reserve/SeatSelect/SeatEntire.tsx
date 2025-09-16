import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './SeatEntire.module.css';
import { useDateStore } from '@/stores/dateStore';

type Seat = { id: number; rowName: string; seatNumber: string | number };
type SeatSection = {
  id: number;
  sectionName: string;
  colorCode: string;
  price: number;
  seats: Seat[];
};

type SeatReservationApiItem = {
  id: number;
  rowName: string;
  seatNumber: number;
  seatReservationState: string; // "AVAILABLE" 등
  concertId?: number; // 있으면 props.concertId로 필터
};

type SeatEntireProps = {
  concertId: number;
  title: string;
  location: string;
  svgUrl?: string;
  seatSections: SeatSection[] | undefined | null;
};

const TOKEN_KEY = 'accessToken';
const API_BASE = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL || '';

/* ========= 키 유틸 ========= */
const rowSeatKey = (rowName: string | number, seatNumber: string | number) =>
  `${String(rowName).toUpperCase()}-${String(seatNumber)}`;

const sectionRowSeatKey = (
  sectionId: number,
  rowName: string | number,
  seatNumber: string | number,
) => `${sectionId}:${rowSeatKey(rowName, seatNumber)}`;

/* ========= SVG 태깅(동일) ========= */
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
function getElementHash(el: Element, rootSvg: SVGSVGElement): string {
  const sig = getElementSignature(el, rootSvg);
  return hashString(sig).toLowerCase();
}

function tagSvgSections(svgText: string, sections: SeatSection[] | undefined | null) {
  const list = Array.isArray(sections) ? sections : [];

  const isHexColor = (s?: string) =>
    !!s && /^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(s.trim());
  const toNormHex = (s: string) =>
    s.startsWith('#') ? s.toLowerCase() : `#${s.toLowerCase()}`;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const root = doc.documentElement as unknown as SVGSVGElement;

    const hashMap = new Map<string, SeatSection>();
    const colorHexSet = new Set<string>();

    for (const s of list) {
      const raw = (s.colorCode || '').trim();
      if (!raw) continue;
      if (isHexColor(raw)) colorHexSet.add(toNormHex(raw));
      else hashMap.set(raw.toLowerCase(), s);
    }

    const candidates = Array.from(
      root.querySelectorAll('polygon, rect, path, circle, ellipse, polyline, g'),
    ) as Element[];

    for (const el of candidates) {
      const hash = getElementHash(el, root);
      const secByHash = hashMap.get(hash);
      if (secByHash && !el.hasAttribute('data-section-id')) {
        el.setAttribute('data-section-id', String(secByHash.id));
        el.setAttribute('style', `${el.getAttribute('style') || ''};cursor:pointer`);
        continue;
      }
      if (colorHexSet.size) {
        const fill = (el.getAttribute('fill') || '').toLowerCase();
        const stroke = (el.getAttribute('stroke') || '').toLowerCase();
        const style = (el.getAttribute('style') || '').toLowerCase();
        const matchedHex = Array.from(colorHexSet).find(
          (hex) =>
            fill === hex ||
            stroke === hex ||
            style.includes(`fill:${hex}`) ||
            style.includes(`stroke:${hex}`),
        );
        if (matchedHex && !el.hasAttribute('data-section-id')) {
          const sec = list.find(
            (s) => s.colorCode && toNormHex(s.colorCode) === matchedHex,
          );
          if (sec) {
            el.setAttribute('data-section-id', String(sec.id));
            el.setAttribute('style', `${el.getAttribute('style') || ''};cursor:pointer`);
          }
        }
      }
    }
    return new XMLSerializer().serializeToString(root);
  } catch (e) {
    console.warn('SVG tagging fallback:', e);
    return svgText;
  }
}

/* ========= 컴포넌트 ========= */
export default function SeatEntire({
  concertId,
  title,
  location,
  svgUrl,
  seatSections,
}: SeatEntireProps) {
  const { selectedDate, updateSeatSelection, clearSeatSelection } = useDateStore();
  const safeSections = Array.isArray(seatSections) ? seatSections : [];

  const [svgMarkup, setSvgMarkup] = useState<string>('');
  const [svgError, setSvgError] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);

  // 화면 내 선택(최대 2개)
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<number>>(new Set());

  // 🔒 비활성화 좌석 키 집합: `${sectionId}:${ROW}-${SEAT}`
  const [disabledSeatKeys, setDisabledSeatKeys] = useState<Set<string>>(new Set());

  const containerRef = useRef<HTMLDivElement | null>(null);

  // 섹션 맵
  const sectionMap = useMemo(() => {
    const m = new Map<number, SeatSection>();
    safeSections.forEach((s) => m.set(s.id, s));
    return m;
  }, [safeSections]);

  const selectedSection = selectedSectionId
    ? (sectionMap.get(selectedSectionId) ?? null)
    : null;

  // 🔎 row-seat → sectionId 역인덱스 (전체 섹션 대상)
  const reverseIndex = useMemo(() => {
    const idx = new Map<string, number>(); // key: "ROW-SEAT" => sectionId
    for (const sec of safeSections) {
      for (const seat of sec.seats || []) {
        idx.set(rowSeatKey(seat.rowName, seat.seatNumber), sec.id);
      }
    }
    return idx;
  }, [safeSections]);

  // 🛰️ 서버에서 seatReservations 받아 비활성화 키 만들기
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const token =
          typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
        const headers: Record<string, string> = { Accept: '*/*' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`${API_BASE}/api/reserve`, { headers });
        if (!res.ok) throw new Error(`RESERVE_HTTP_${res.status}`);
        const data = await res.json();

        // data.seatReservations 배열 가정
        const list: SeatReservationApiItem[] = Array.isArray(data?.seatReservations)
          ? data.seatReservations
          : [];

        // 현재 콘서트만 필터 (concertId가 응답에 있을 때만)
        const filtered = list.filter((it) =>
          typeof it.concertId === 'number' ? it.concertId === concertId : true,
        );

        const next = new Set<string>();
        for (const it of filtered) {
          // 요구사항: "AVAILABLE" 좌석을 비활성화 처리
          if (String(it.seatReservationState).toUpperCase() !== 'AVAILABLE') continue;

          const rsKey = rowSeatKey(it.rowName, it.seatNumber);
          const secId = reverseIndex.get(rsKey);
          if (!secId) continue; // 해당 row/seat가 어떤 섹션인지 못 찾으면 스킵

          next.add(sectionRowSeatKey(secId, it.rowName, it.seatNumber));
        }

        if (!aborted) setDisabledSeatKeys(next);
      } catch (e) {
        console.error('load seatReservations failed:', e);
        if (!aborted) setDisabledSeatKeys(new Set());
      }
    })();
    return () => {
      aborted = true;
    };
  }, [concertId, reverseIndex]);

  // 섹션 → 그리드
  const seatGrid = useMemo(() => {
    if (!selectedSection) return null;

    const byRow = new Map<string, Seat[]>();
    (selectedSection.seats || []).forEach((s) => {
      const row = (s.rowName || '').toUpperCase();
      if (!byRow.has(row)) byRow.set(row, []);
      byRow.get(row)!.push(s);
    });

    const rows = Array.from(byRow.keys()).sort((a, b) => a.localeCompare(b, 'en'));

    let maxCols = 0;
    rows.forEach((row) => {
      const nums = byRow
        .get(row)!
        .map((s) => parseInt(String(s.seatNumber), 10))
        .filter((n) => Number.isFinite(n));
      const m = nums.length ? Math.max(...nums) : 0;
      maxCols = Math.max(maxCols, m);
    });

    const grid: Array<{ row: string; cells: Array<{ seat?: Seat; key: string }> }> = [];

    rows.forEach((row) => {
      const seatsInRow = byRow.get(row)!;
      const mapByNum = new Map<number, Seat>();
      seatsInRow.forEach((s) => {
        const n = parseInt(String(s.seatNumber), 10);
        if (Number.isFinite(n)) mapByNum.set(n, s);
      });

      const cells: Array<{ seat?: Seat; key: string }> = [];
      for (let i = 1; i <= maxCols; i++) {
        const seat = mapByNum.get(i);
        cells.push({ seat, key: `${row}-${i}` });
      }
      grid.push({ row, cells });
    });

    return { rows, grid, cols: maxCols };
  }, [selectedSection]);

  /* ===== SVG 로드 & 태깅 ===== */
  useEffect(() => {
    let aborted = false;
    async function run() {
      setSvgError(null);
      setSvgMarkup('');
      if (!svgUrl) return;
      try {
        const token =
          typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
        const headers: Record<string, string> = { Accept: 'image/svg+xml,*/*' };
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(svgUrl, { headers });
        if (!res.ok) throw new Error(`SVG_HTTP_${res.status}`);
        const text = await res.text();

        const tagged = tagSvgSections(text, safeSections);
        if (!aborted) setSvgMarkup(tagged);
      } catch (e: any) {
        console.error('SVG load error:', e);
        if (!aborted) setSvgError('배치도를 불러올 수 없습니다.');
      }
    }
    run();
    return () => {
      aborted = true;
    };
  }, [svgUrl, safeSections]);

  /* ===== SVG에서 섹션 클릭 → 좌석표 보기로 전환 ===== */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onClick = (evt: MouseEvent) => {
      const target = evt.target as HTMLElement | null;
      if (!target) return;
      const host = (target.closest('[data-section-id]') as HTMLElement) || null;
      if (!host) return;
      const secIdAttr = host.getAttribute('data-section-id');
      if (!secIdAttr) return;
      const secId = Number(secIdAttr);
      setSelectedSectionId(secId);
      setSelectedSeatIds(new Set()); // 화면 선택 초기화
      clearSeatSelection();
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, [svgMarkup, clearSeatSelection]);

  /* ===== 좌석 토글 (최대 2개, 비활성화면 토글 금지) ===== */
  const toggleSeat = (seatId: number) => {
    if (!selectedSection) return;
    const seat = (selectedSection.seats || []).find((s) => s.id === seatId);
    if (!seat) return;

    const key = sectionRowSeatKey(selectedSection.id, seat.rowName, seat.seatNumber);
    if (disabledSeatKeys.has(key)) return; // 🔒 비활성 좌석은 클릭 무시

    setSelectedSeatIds((prev) => {
      const next = new Set(prev);
      if (next.has(seatId)) {
        next.delete(seatId);
        return next;
      }
      if (next.size >= 2) {
        alert('최대 2좌석까지 선택 가능합니다.');
        return prev;
      }
      next.add(seatId);
      return next;
    });
  };

  /* ✅ 선택한 좌석을 zustand에 동기화 */
  useEffect(() => {
    if (!selectedSection) {
      clearSeatSelection();
      return;
    }
    const seatById = new Map<number, Seat>();
    (selectedSection.seats || []).forEach((s) => seatById.set(Number(s.id), s));

    const selectedSeats = Array.from(selectedSeatIds)
      .map((id) => seatById.get(id))
      .filter(Boolean)
      .map((s) => ({
        id: Number((s as Seat).id),
        rowName: String((s as Seat).rowName),
        seatNumber: String((s as Seat).seatNumber),
      }));

    useDateStore.getState().updateSeatSelection({
      sectionId: selectedSection.id,
      seats: selectedSeats,
      pricePerSeat: selectedSection.price,
    });
  }, [selectedSeatIds, selectedSection, clearSeatSelection]);

  /* ===== 초기화 (SVG 다시 보기) ===== */
  const resetToSvg = () => {
    setSelectedSectionId(null);
    setSelectedSeatIds(new Set());
    clearSeatSelection();
  };

  const dateLabel = selectedDate
    ? selectedDate.toLocaleDateString('ko-KR')
    : '날짜 미선택';
  const isSeatView = !!selectedSection;

  return (
    <div className={styles.leftPanel}>
      <div className={styles.concertTitle}>{title}</div>

      <div className={styles.concertInfo}>
        <div className={styles.cocertVenue}>
          {location}
          <div className={styles.line} />
          <div className={styles.date}>{dateLabel}</div>
        </div>
      </div>

      {!isSeatView ? (
        <div className={styles.seats}>
          {svgError ? (
            <div className={styles.svgError}>{svgError}</div>
          ) : !svgMarkup ? (
            <div className={styles.svgLoading}>배치도 로딩 중…</div>
          ) : (
            <div
              ref={containerRef}
              className={styles.svgHost}
              dangerouslySetInnerHTML={{ __html: svgMarkup }}
            />
          )}
        </div>
      ) : (
        <div className={styles.seatPanel}>
          <div className={styles.seatPanelHeader}>
            <div className={styles.sectionMeta}>
              <strong>
                {selectedSection.sectionName || `구역 ${selectedSection.id}`}
              </strong>
              <span className={styles.dot} />
              <span>₩{selectedSection.price.toLocaleString()}</span>
            </div>
            <button className={styles.resetBtn} onClick={resetToSvg}>
              초기화 (SVG 다시 선택)
            </button>
          </div>

          {!seatGrid || seatGrid.cols === 0 ? (
            <div className={styles.seatsEmpty}>이 구역에는 좌석 정보가 없습니다.</div>
          ) : (
            <div className={styles.seatGridContainer}>
              {seatGrid.grid.map(({ row, cells }) => (
                <div
                  key={row}
                  className={styles.rowBlock}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr',
                    columnGap: 8,
                    alignItems: 'center',
                  }}
                >
                  <div className={styles.rowLabel}>{row}</div>

                  <div
                    className={styles.seatRow}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${seatGrid.cols}, var(--seat-size, 34px))`,
                      gap: 6,
                    }}
                  >
                    {cells.map(({ seat, key }) => {
                      if (!seat) {
                        return (
                          <div
                            key={key}
                            className={`${styles.seatCell} ${styles.placeholder}`}
                          />
                        );
                      }
                      const fullKey = sectionRowSeatKey(
                        selectedSection.id,
                        seat.rowName,
                        seat.seatNumber,
                      );
                      const isDisabled = disabledSeatKeys.has(fullKey);
                      const isSelected = selectedSeatIds.has(Number(seat.id));

                      return (
                        <button
                          key={key}
                          type='button'
                          className={`${styles.seatCell}
                                      ${isSelected ? styles.selected : ''}
                                      ${isDisabled ? styles.disabled : ''}`}
                          onClick={() => !isDisabled && toggleSeat(Number(seat.id))}
                          title={`${seat.rowName}${seat.seatNumber}`}
                          disabled={isDisabled}
                        >
                          <span className={styles.seatLabel}>
                            {seat.rowName}
                            {seat.seatNumber}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className={styles.selectionInfo}>
            선택한 좌석: {Array.from(selectedSeatIds).length} / 2
          </div>
        </div>
      )}
    </div>
  );
}
