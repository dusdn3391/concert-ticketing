// components/admin/zone/editor/ZoneEditor.tsx
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';

import styles from './zoneEditor.module.css';
import Button from '../../common/ui/Button';
import { Icons } from '../../common/ui/Icons';
import SeatGrid from './seatGrid';
import BulkModal from './bulkModal';

import { useConcertStore, ApiSeatSection } from '@/stores/concert';

interface Seat {
  id: string;
  row: string;
  number: number;
  x: number;
  y: number;
  status: 'available' | 'occupied' | 'disabled';
  selected?: boolean;
  colorCode?: string; // 있으면 이 값으로 섹션 분류
}

type ApiSeat = {
  id: number; // 신규면 0
  rowName: string; // 'A'
  seatNumber: string; // '1' | '' (빈자리)
};

type ApiSeatSectionLocal = ApiSeatSection; // 동일 타입 재사용

interface ZoneEditorProps {
  zoneId?: string; // URL의 [zoneId] (== colorCode)
  initialSeats?: Seat[];
  onSeatUpdate?: (seats: Seat[]) => void;
  concertId: string | number; // 저장 대상 concert id
}

interface SimpleBulkConfig {
  rows: string[];
  seatsPerRow: number;
  startRow: number;
  startCol: number;
}

type ConcertRequest = {
  id: number;
  title: string;
  description: string;
  location: string;
  locationX: number;
  locationY: number;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string; // 'YYYY-MM-DD'
  reservationStartDate: string; // ISO 8601 or 'YYYY-MM-DDTHH:mm:ss'
  reservationEndDate: string; // ISO 8601 or 'YYYY-MM-DDTHH:mm:ss'
  price: string;
  rating: number;
  limitAge: number;
  durationTime: number;
  adminId: number;
  concertHallName: string | null;
};

export default function ZoneEditor({
  zoneId,
  initialSeats = [],
  onSeatUpdate,
  concertId,
}: ZoneEditorProps) {
  const router = useRouter();

  /** ====== 스토어 접근 ====== */
  const fetchConcert = useConcertStore((s) => s.fetchConcert);
  const concert = useConcertStore((s) => s.get(concertId));
  const isLoading = useConcertStore((s) => s.isLoading(concertId));

  /** ====== concertId / zoneId 해석 ====== */
  const resolvedConcertId = useMemo(() => {
    if (concertId !== undefined && concertId !== null) return String(concertId);
    const q = router.query?.concertId ?? router.query?.id; // id로 오는 경우도 대비
    return typeof q === 'string' ? q : Array.isArray(q) ? q[0] : undefined;
  }, [concertId, router.query]);

  const resolvedZoneId = useMemo(() => {
    const q = zoneId ?? router.query?.zoneId;
    return typeof q === 'string' ? q : Array.isArray(q) ? q[0] : undefined;
  }, [zoneId, router.query]);

  /** ====== 상태 ====== */
  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [gridRows, setGridRows] = useState(8);
  const [gridCols, setGridCols] = useState(12);
  const [availableRows, setAvailableRows] = useState<string[]>(['A', 'B', 'C', 'D', 'E']);
  const [selectedRow, setSelectedRow] = useState<string>('A');
  const [draggedSeat, setDraggedSeat] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(
    null,
  );
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isGuideTooltipVisible, setIsGuideTooltipVisible] = useState(false);

  const dragImageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!resolvedConcertId) return;
    if (!concert && !isLoading) fetchConcert(resolvedConcertId);
  }, [resolvedConcertId, concert, isLoading, fetchConcert]);

  /** ====== seatSections -> 초기 좌석 변환 ====== */
  const storeSeatSections: ApiSeatSectionLocal[] = useMemo(
    () => (Array.isArray(concert?.seatSections) ? concert!.seatSections : []),
    [concert],
  );

  const mapSeatSectionsToSeats = useCallback(
    (sections: ApiSeatSectionLocal[]): Seat[] => {
      const result: Seat[] = [];
      let sectionOffsetX = 0;

      sections.forEach((section, sectionIdx) => {
        const byRow: Record<string, ApiSeat[]> = {};
        (section.seats || []).forEach((s) => {
          byRow[s.rowName] ??= [];
          byRow[s.rowName].push(s);
        });

        const sortedRows = Object.keys(byRow).sort(); // 'A','B',...
        sortedRows.forEach((rowName, rowIdx) => {
          const y = rowIdx + sectionIdx * 6; // 섹션마다 6칸 아래로
          const rowSeats = byRow[rowName];

          // seatNumber 순서대로 배치, 빈칸('')은 스킵
          const nums = rowSeats
            .map((s) => s.seatNumber)
            .filter((sn) => String(sn).trim() !== '')
            .map((sn) => Number(sn))
            .sort((a, b) => a - b);

          nums.forEach((n, i) => {
            result.push({
              id: `sec${section.id}-${rowName}-${n}`,
              row: rowName,
              number: n,
              x: sectionOffsetX + i, // 가로로 쭉
              y,
              status: 'available',
              colorCode: section.colorCode,
            });
          });
        });

        sectionOffsetX += 14; // 섹션 간 x 간격
      });

      return result;
    },
    [],
  );

  // 초기 좌석 세팅
  useEffect(() => {
    if (!storeSeatSections.length) return;
    const mapped = mapSeatSectionsToSeats(storeSeatSections);
    setSeats((prev) => (initialSeats.length ? prev : mapped));

    // 행 후보 업데이트 + 그리드 보정
    const rows = Array.from(new Set(mapped.map((s) => s.row))).sort();
    if (rows.length) {
      setAvailableRows(rows);
      setSelectedRow(rows[0]);
      const maxX = mapped.reduce((m, s) => Math.max(m, s.x), 0);
      const maxY = mapped.reduce((m, s) => Math.max(m, s.y), 0);
      setGridCols(Math.max(12, maxX + 4));
      setGridRows(Math.max(8, maxY + 4));
    }
  }, [storeSeatSections, initialSeats, mapSeatSectionsToSeats]);

  /** ====== 통계 ====== */
  const seatStats = useMemo(() => {
    const total = seats.length;
    const available = seats.filter((seat) => seat.status === 'available').length;
    const occupied = seats.filter((seat) => seat.status === 'occupied').length;
    const disabled = seats.filter((seat) => seat.status === 'disabled').length;
    const selected = selectedSeats.length;
    return { total, available, occupied, disabled, selected };
  }, [seats, selectedSeats]);

  /** ====== 그리드 크기 조절 ====== */
  const expandGridRight = useCallback(
    () => setGridCols((prev) => Math.min(prev + 1, 50)),
    [],
  );
  const expandGridBottom = useCallback(
    () => setGridRows((prev) => Math.min(prev + 1, 30)),
    [],
  );
  const shrinkGridRight = useCallback(
    () => setGridCols((prev) => Math.max(prev - 1, 5)),
    [],
  );
  const shrinkGridBottom = useCallback(
    () => setGridRows((prev) => Math.max(prev - 1, 5)),
    [],
  );

  /** ====== 좌석 상호작용 ====== */
  const handleSeatClick = useCallback((seatId: string) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId],
    );
  }, []);

  const handleSeatDelete = useCallback((seatId: string) => {
    setSeats((prev) => prev.filter((seat) => seat.id !== seatId));
    setSelectedSeats((prev) => prev.filter((id) => id !== seatId));
  }, []);

  const handleGridCellClick = useCallback(
    (row: number, col: number) => {
      const existingSeat = seats.find((seat) => seat.x === col && seat.y === row);
      if (existingSeat) return;

      const existingSeatsInRow = seats.filter((seat) => seat.row === selectedRow);
      const maxNumber =
        existingSeatsInRow.length > 0
          ? Math.max(...existingSeatsInRow.map((seat) => seat.number))
          : 0;

      const newSeat: Seat = {
        id: `seat-${Date.now()}-${row}-${col}`,
        row: selectedRow,
        number: maxNumber + 1,
        x: col,
        y: row,
        status: 'available',
        // ✅ 현재 구역(colorCode) 자동 부여 (저장 시 섹션 매핑 누락 방지)
        colorCode: resolvedZoneId,
      };

      setSeats((prev) => [...prev, newSeat]);
    },
    [seats, selectedRow, resolvedZoneId],
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedSeats.length === 0) return;
    const confirmDelete = window.confirm(
      `선택된 ${selectedSeats.length}개의 좌석을 삭제하시겠습니까?`,
    );
    if (confirmDelete) {
      setSeats((prev) => prev.filter((seat) => !selectedSeats.includes(seat.id)));
      setSelectedSeats([]);
    }
  }, [selectedSeats]);

  const handleChangeSelectedStatus = useCallback(
    (status: Seat['status']) => {
      if (selectedSeats.length === 0) return;
      setSeats((prev) =>
        prev.map((seat) =>
          selectedSeats.includes(seat.id) ? { ...seat, status } : seat,
        ),
      );
    },
    [selectedSeats],
  );

  const handleSelectAll = useCallback(() => {
    setSelectedSeats(seats.map((seat) => seat.id));
  }, [seats]);

  const handleDeselectAll = useCallback(() => {
    setSelectedSeats([]);
  }, []);

  /** ====== Drag & Drop ====== */
  const handleDragStart = useCallback((e: React.DragEvent, seatId: string) => {
    setDraggedSeat(seatId);
    if (dragImageRef.current) {
      e.dataTransfer.setDragImage(dragImageRef.current, 0, 0);
    }
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setHoveredCell({ row, col });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, row: number, col: number) => {
      e.preventDefault();
      if (!draggedSeat) return;

      const existingSeat = seats.find((seat) => seat.x === col && seat.y === row);
      if (existingSeat && existingSeat.id !== draggedSeat) return;

      setSeats((prev) =>
        prev.map((seat) =>
          seat.id === draggedSeat ? { ...seat, x: col, y: row } : seat,
        ),
      );

      setDraggedSeat(null);
      setHoveredCell(null);
    },
    [draggedSeat, seats],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedSeat(null);
    setHoveredCell(null);
  }, []);

  /** ====== 좌표 → 좌석 조회 ====== */
  const getSeatAtPosition = useCallback(
    (x: number, y: number) => seats.find((seat) => seat.x === x && seat.y === y),
    [seats],
  );

  /** ====== 대량 생성 ====== */
  const handleSimpleBulkCreate = useCallback(
    (config: SimpleBulkConfig) => {
      const newSeats: Seat[] = [];
      const { rows, seatsPerRow, startRow, startCol } = config;

      rows.forEach((rowName, rowIndex) => {
        const currentRowY = startRow + rowIndex;
        if (currentRowY >= gridRows) return;

        for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
          const currentColX = startCol + (seatNum - 1);
          if (currentColX >= gridCols) break;

          newSeats.push({
            id: `bulk-simple-${rowName}-${seatNum}-${Date.now()}`,
            row: rowName,
            number: seatNum,
            x: currentColX,
            y: currentRowY,
            status: 'available',
            colorCode: resolvedZoneId, // ✅ 대량 생성도 현재 섹션으로
          });
        }
      });

      const filteredNewSeats = newSeats.filter(
        (newSeat) =>
          !seats.some(
            (existingSeat) =>
              existingSeat.x === newSeat.x && existingSeat.y === newSeat.y,
          ),
      );

      setSeats((prev) => [...prev, ...filteredNewSeats]);
      setIsBulkModalOpen(false);
    },
    [seats, gridRows, gridCols, resolvedZoneId],
  );

  /** ========= 특정 colorCode(= resolvedZoneId) 섹션만 만들기 ========= */
  const buildSingleSeatSectionByColor = useCallback(
    (
      allSeats: Seat[],
      colorCode: string,
      sectionMeta?: { id: number; sectionName: string; price: number },
      options?: { treatDisabledAsEmpty?: boolean },
    ) => {
      const treatDisabledAsEmpty = options?.treatDisabledAsEmpty ?? false;

      const inThisSection = allSeats.filter((s) => (s.colorCode ?? '') === colorCode);
      // 행별 그룹화
      const byRow: Record<string, Seat[]> = {};
      inThisSection.forEach((s) => {
        byRow[s.row] ??= [];
        byRow[s.row].push(s);
      });

      const apiSeats: ApiSeat[] = [];
      Object.entries(byRow).forEach(([rowName, rowSeats]) => {
        const maxNo = rowSeats.length ? Math.max(...rowSeats.map((r) => r.number)) : 0;
        for (let n = 1; n <= maxNo; n++) {
          const found = rowSeats.find((r) => r.number === n);
          if (!found) {
            apiSeats.push({ id: 0, rowName, seatNumber: '' });
            continue;
          }
          if (treatDisabledAsEmpty && found.status === 'disabled') {
            apiSeats.push({ id: 0, rowName, seatNumber: '' });
          } else {
            apiSeats.push({ id: 0, rowName, seatNumber: String(found.number) });
          }
        }
      });

      return {
        id: sectionMeta?.id ?? 0, // 신규면 0
        sectionName: sectionMeta?.sectionName ?? '',
        colorCode, // <= resolvedZoneId
        price: sectionMeta?.price ?? 0,
        seats: apiSeats,
      };
    },
    [],
  );

  /** ========= multipart/form-data PUT ========= */
  const handleSaveMultipart = useCallback(async () => {
    if (!resolvedConcertId) {
      alert('concertId를 찾을 수 없습니다.');
      return;
    }
    if (!resolvedZoneId) {
      alert('zoneId(colorCode)를 찾을 수 없습니다.');
      return;
    }

    onSeatUpdate?.(seats);

    // ✅ 저장 직전, 스토어 최신 스냅샷으로만 ConcertRequest 구성
    // (필요 시 최신 fetch 재시도)
    let latest = useConcertStore.getState().get(resolvedConcertId);
    if (!latest) {
      await fetchConcert(resolvedConcertId);
      latest = useConcertStore.getState().get(resolvedConcertId);
    }
    if (!latest) {
      alert('콘서트 데이터를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
      return;
    }

    // ✅ 필수 필드 검증 (스토어 값 없으면 저장 중단)
    const required: Array<[string, any]> = [
      ['id', (latest as any).id],
      ['title', (latest as any).title],
      ['location', (latest as any).location],
      ['startDate', (latest as any).startDate],
      ['endDate', (latest as any).endDate],
      ['reservationStartDate', (latest as any).reservationStartDate],
      ['reservationEndDate', (latest as any).reservationEndDate],
      ['price', (latest as any).price],
      ['rating', (latest as any).rating],
      ['limitAge', (latest as any).limitAge],
      ['durationTime', (latest as any).durationTime],
      ['adminId', (latest as any).adminId],
    ];
    const missing = required.filter(([, v]) => v === undefined || v === null || v === '');
    if (missing.length) {
      alert(
        `저장 불가: 스토어에 누락된 필드가 있습니다 → ${missing.map(([k]) => k).join(', ')}`,
      );
      return;
    }

    // ✅ 전부 스토어 값으로만 구성 (하드코딩/기본값 없음)
    const concertRequest: ConcertRequest = {
      id: Number((latest as any).id),
      title: String((latest as any).title),
      description: String((latest as any).description ?? ''), // 선택 필드: 비어있을 수 있음 (스토어 값 기반)
      location: String((latest as any).location),
      locationX: Number((latest as any).locationX),
      locationY: Number((latest as any).locationY),
      startDate: String((latest as any).startDate),
      endDate: String((latest as any).endDate),
      reservationStartDate: String((latest as any).reservationStartDate),
      reservationEndDate: String((latest as any).reservationEndDate),
      price: String((latest as any).price),
      rating: Number((latest as any).rating),
      limitAge: Number((latest as any).limitAge),
      durationTime: Number((latest as any).durationTime),
      adminId: Number((latest as any).adminId),
      concertHallName:
        (latest as any).concertHallName === null
          ? null
          : String((latest as any).concertHallName ?? ''), // null 허용
    };

    // (B) seatSections: 현재 편집중 colorCode 하나만
    const template = storeSeatSections.find((s) => s.colorCode === resolvedZoneId);
    const section = buildSingleSeatSectionByColor(
      seats,
      resolvedZoneId,
      template
        ? { id: template.id, sectionName: template.sectionName, price: template.price }
        : { id: 0, sectionName: '', price: 0 }, // 신규 생성 시에도 스토어 기반이 없으면 빈 값
      { treatDisabledAsEmpty: false },
    );
    const seatSectionsPayload = [section];

    // (C) FormData 구성
    const fd = new FormData();
    fd.append('concertRequest', JSON.stringify(concertRequest));
    // 필요 시, 회차가 있다면 이렇게 추가:
    // fd.append('scheduleRequests', JSON.stringify(scheduleRequestsArray));
    fd.append('seatSections', JSON.stringify(seatSectionsPayload));

    // 파일 추가가 필요하면 File 객체로 추가 (서버 계약필드명에 맞춰)
    // fd.append('thumbnailImage', thumbnailFile);
    // fd.append('descriptionImage', descriptionFile);
    // fd.append('svgImage', svgFile);

    const token =
      localStorage.getItem('admin_token') || localStorage.getItem('accessToken') || '';
    const base = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL || '';
    const url = `${base}/api/concerts/${resolvedConcertId}`;

    console.groupCollapsed('[ZoneEditor] PUT multipart payload');
    console.log('URL:', url);
    console.log('concertRequest:', concertRequest);
    console.log('seatSections:', seatSectionsPayload);
    console.groupEnd();

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        // ⚠️ Content-Type를 수동 설정하지 마세요 (브라우저가 boundary 포함 자동 설정)
        Accept: '*/*',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: fd,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('❌ Save failed:', res.status, text);
      alert(`좌석 저장 실패 (status: ${res.status})`);
      return;
    }

    const data = await res.json().catch(() => ({}));
    console.log('✅ Save success:', data);
    alert('좌석이 저장되었습니다.');

    // 성공 후 최신 데이터 재조회(옵션)
    fetchConcert(resolvedConcertId);
  }, [
    resolvedConcertId,
    resolvedZoneId,
    seats,
    onSeatUpdate,
    storeSeatSections,
    buildSingleSeatSectionByColor,
    fetchConcert,
  ]);

  /** ========= 렌더 ========= */
  return (
    <div className={styles.compactContainer}>
      {/* 투명 드래그 이미지 */}
      <div ref={dragImageRef} className={styles.dragImage} />

      {/* 컴팩트 헤더 */}
      <div className={styles.compactHeader}>
        <div className={styles.headerLeft}>
          <h2 className={styles.compactTitle}>좌석 에디터</h2>
          {resolvedZoneId && (
            <span className={styles.zoneId}>Zone: {resolvedZoneId}</span>
          )}
        </div>

        <div className={styles.compactHeaderControls}>
          <button
            className={`${styles.guideTooltipBtn} ${isGuideTooltipVisible ? styles.active : ''}`}
            onClick={() => setIsGuideTooltipVisible(!isGuideTooltipVisible)}
            title='사용 가이드'
          >
            ❓ 가이드
          </button>

          {/* ✅ 멀티파트 저장 */}
          <Button
            variant='success'
            icon={<Icons.Save />}
            onClick={handleSaveMultipart}
            size='small'
          >
            저장
          </Button>
        </div>
      </div>

      {/* 가이드 툴팁 */}
      {isGuideTooltipVisible && (
        <div className={styles.guideTooltip}>
          <div className={styles.tooltipHeader}>
            <h3>사용 가이드</h3>
            <button onClick={() => setIsGuideTooltipVisible(false)}>×</button>
          </div>
          <div className={styles.tooltipContent}>
            <div className={styles.guideItem}>
              <strong>좌석 추가:</strong> 빈 셀 클릭
            </div>
            <div className={styles.guideItem}>
              <strong>좌석 이동:</strong> 드래그 & 드롭
            </div>
            <div className={styles.guideItem}>
              <strong>좌석 선택:</strong> 좌석 클릭
            </div>
            <div className={styles.guideItem}>
              <strong>좌석 삭제:</strong> 호버 시 X 버튼
            </div>
            <div className={styles.guideItem}>
              <strong>그리드 확장:</strong> 그리드 가장자리 + 버튼
            </div>
            <div className={styles.guideItem}>
              <strong>대량 작업:</strong> 왼쪽 패널 사용
            </div>
          </div>
        </div>
      )}

      {/* 컴팩트 행 관리 및 그리드 컨트롤 */}
      <div className={styles.compactRowManager}>
        <div className={styles.controlsRow}>
          {/* 행 관리 */}
          <div className={styles.rowSection}>
            <span className={styles.sectionLabel}>행:</span>
            <select
              title='selectedRow'
              value={selectedRow}
              onChange={(e) => setSelectedRow(e.target.value)}
              className={styles.rowSelect}
            >
              {availableRows.map((row) => (
                <option key={row} value={row}>
                  {row}
                </option>
              ))}
            </select>
            <input
              type='text'
              placeholder='새 행'
              className={styles.newRowInput}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  const newRow = input.value.trim().toUpperCase();
                  if (newRow && !availableRows.includes(newRow)) {
                    setAvailableRows([...availableRows, newRow]);
                    setSelectedRow(newRow);
                    input.value = '';
                  }
                }
              }}
            />
          </div>

          {/* 그리드 정보 */}
          <div className={styles.gridInfoSection}>
            <span className={styles.gridSize}>
              그리드: {gridRows} × {gridCols}
            </span>
            <span className={styles.seatCount}>좌석: {seats.length}개</span>
          </div>

          {/* 그리드 크기 조절 */}
          <div className={styles.gridControls}>
            <div className={styles.gridControlGroup}>
              <span className={styles.controlLabel}>가로:</span>
              <button
                className={styles.gridButton}
                onClick={shrinkGridRight}
                disabled={gridCols <= 5}
                title='가로 축소'
              >
                -
              </button>
              <span className={styles.gridValue}>{gridCols}</span>
              <button
                className={styles.gridButton}
                onClick={expandGridRight}
                disabled={gridCols >= 50}
                title='가로 확장'
              >
                +
              </button>
            </div>
            <div className={styles.gridControlGroup}>
              <span className={styles.controlLabel}>세로:</span>
              <button
                className={styles.gridButton}
                onClick={shrinkGridBottom}
                disabled={gridRows <= 5}
                title='세로 축소'
              >
                -
              </button>
              <span className={styles.gridValue}>{gridRows}</span>
              <button
                className={styles.gridButton}
                onClick={expandGridBottom}
                disabled={gridRows >= 30}
                title='세로 확장'
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 에디터 영역 */}
      <div className={styles.compactEditorArea}>
        {/* 좌측 고정 컨트롤 패널 */}
        <div className={styles.fixedControlPanel}>
          {/* 통계 */}
          <div className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>통계</h3>
            <div className={styles.compactStats}>
              <div className={styles.statChip}>
                <span className={styles.statLabel}>전체</span>
                <span className={styles.statValue}>{seatStats.total}</span>
              </div>
              <div className={styles.statChip}>
                <span className={styles.statLabel}>선택</span>
                <span className={styles.statValue}>{seatStats.selected}</span>
              </div>
              <div className={styles.statChip}>
                <span className={styles.statLabel}>가능</span>
                <span className={styles.statValue}>{seatStats.available}</span>
              </div>
              <div className={styles.statChip}>
                <span className={styles.statLabel}>예약</span>
                <span className={styles.statValue}>{seatStats.occupied}</span>
              </div>
            </div>
          </div>

          {/* 빠른 액션 */}
          <div className={styles.actionsSection}>
            <h3 className={styles.sectionTitle}>빠른 액션</h3>
            {selectedSeats.length > 0 ? (
              <div className={styles.quickActions}>
                <div className={styles.quickActionButtons}>
                  <button
                    className={`${styles.statusBtn} ${styles.available}`}
                    onClick={() => handleChangeSelectedStatus('available')}
                    title='사용 가능으로 만들기'
                  >
                    ✓
                  </button>
                  <button
                    className={`${styles.statusBtn} ${styles.occupied}`}
                    onClick={() => handleChangeSelectedStatus('occupied')}
                    title='예약됨으로 만들기'
                  >
                    ✕
                  </button>
                  <button
                    className={`${styles.statusBtn} ${styles.disabled}`}
                    onClick={() => handleChangeSelectedStatus('disabled')}
                    title='사용 불가로 만들기'
                  >
                    ⛔
                  </button>
                </div>
              </div>
            ) : (
              <p className={styles.noSelection}>좌석을 선택하세요</p>
            )}
          </div>

          {/* 대량 작업 */}
          <div className={styles.bulkSection}>
            <h3 className={styles.sectionTitle}>대량 작업</h3>
            <div className={styles.bulkActions}>
              <button
                className={styles.bulkButton}
                onClick={() => setIsBulkModalOpen(true)}
              >
                🏢 대량 생성
              </button>
              <button className={styles.bulkButton} onClick={handleSelectAll}>
                ✓ 전체 선택
              </button>
              <button className={styles.bulkButton} onClick={handleDeselectAll}>
                ✕ 선택 해제
              </button>
              <button
                className={styles.bulkButton}
                onClick={handleDeleteSelected}
                disabled={selectedSeats.length === 0}
              >
                🗑️ 선택 삭제
              </button>
            </div>
          </div>
        </div>

        {/* 좌석 그리드 */}
        <div className={styles.compactSeatGridWrapper}>
          <SeatGrid
            gridRows={gridRows}
            gridCols={gridCols}
            seats={seats}
            selectedSeats={selectedSeats}
            draggedSeat={draggedSeat}
            hoveredCell={hoveredCell}
            onGridCellClick={handleGridCellClick}
            onSeatClick={handleSeatClick}
            onSeatDelete={handleSeatDelete}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            getSeatAtPosition={getSeatAtPosition}
          />
        </div>
      </div>

      {/* 컴팩트 범례 */}
      <div className={styles.compactLegend}>
        <div className={styles.legendChip}>
          <div className={`${styles.legendDot} ${styles.available}`} />
          <span>가능</span>
        </div>
        <div className={styles.legendChip}>
          <div className={`${styles.legendDot} ${styles.occupied}`} />
          <span>예약</span>
        </div>
        <div className={styles.legendChip}>
          <div className={`${styles.legendDot} ${styles.disabled}`} />
          <span>불가</span>
        </div>
        <div className={styles.legendChip}>
          <div className={`${styles.legendDot} ${styles.selected}`} />
          <span>선택</span>
        </div>
      </div>

      {/* 대량 생성 모달 */}
      {isBulkModalOpen && (
        <BulkModal
          availableRows={availableRows}
          gridRows={gridRows}
          gridCols={gridCols}
          onClose={() => setIsBulkModalOpen(false)}
          onBulkCreate={handleSimpleBulkCreate}
        />
      )}
    </div>
  );
}
