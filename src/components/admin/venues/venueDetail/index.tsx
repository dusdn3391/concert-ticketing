import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import styles from './venueDetail.module.css';

interface Zone {
  id: string;
  name: string;
  svgElementId: string;
  seatCount: number;
  priceRange: {
    min: number;
    max: number;
  };
}

interface Venue {
  id: string;
  name: string;
  location: string;
  description: string;
  floorCount: number;
  totalSeats: number;
  status: 'active' | 'draft' | 'archived';
  thumbnail: string;
  createdAt: string;
  lastModified: string;
  tags: string[];
  svgContent: string | null;
  zones: Zone[];
}

interface VenueDetailProps {
  venueId: string;
}

// VenueList와 동일한 목업 데이터
const getVenuesData = (): Venue[] => [
  {
    id: 'seoul-arena',
    name: '서울 아레나',
    location: '서울 송파구',
    description: '올림픽공원 내 대형 콘서트홀로 최대 2만명 수용 가능',
    floorCount: 3,
    totalSeats: 18500,
    status: 'active',
    thumbnail: '#3b82f6',
    createdAt: '2024-03-15',
    lastModified: '2024-06-05 14:30',
    tags: ['대형', '실내', '서울'],
    svgContent: null,
    zones: [],
  },
  {
    id: 'busan-center',
    name: '부산 문화회관',
    location: '부산 해운대구',
    description: '부산 대표 문화공간으로 클래식부터 팝까지 다양한 공연',
    floorCount: 2,
    totalSeats: 1200,
    status: 'active',
    thumbnail: '#10b981',
    createdAt: '2024-04-20',
    lastModified: '2024-06-01 09:15',
    tags: ['중형', '실내', '부산'],
    svgContent: null,
    zones: [],
  },
  {
    id: 'olympic-hall',
    name: '올림픽공원 체조경기장',
    location: '서울 송파구',
    description: '1988 올림픽 체조경기장을 콘서트홀로 리모델링',
    floorCount: 4,
    totalSeats: 15000,
    status: 'draft',
    thumbnail: '#f59e0b',
    createdAt: '2024-05-10',
    lastModified: '2024-05-25 16:45',
    tags: ['대형', '실내', '역사적'],
    svgContent: null,
    zones: [],
  },
  {
    id: 'jeju-arena',
    name: '제주 야외극장',
    location: '제주 제주시',
    description: '자연과 함께하는 야외 콘서트 공간',
    floorCount: 1,
    totalSeats: 8000,
    status: 'archived',
    thumbnail: '#8b5cf6',
    createdAt: '2024-02-05',
    lastModified: '2024-04-10 11:20',
    tags: ['야외', '자연', '제주'],
    svgContent: null,
    zones: [],
  },
];

export default function VenueDetail({ venueId }: VenueDetailProps) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [tempZones, setTempZones] = useState<Zone[]>([]);

  // SVG 확대/축소 상태
  const [svgTransform, setSvgTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const svgContainerRef = useRef<HTMLDivElement>(null);
  const svgWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchVenue = async () => {
      try {
        // TODO: 나중에 실제 API 호출로 변경
        // const response = await fetch(`/api/venues/${venueId}`);
        // const venueData = await response.json();

        // 현재는 목업 데이터에서 해당 ID로 찾기
        const venuesData = getVenuesData();
        const foundVenue = venuesData.find((v) => v.id === venueId);

        setTimeout(() => {
          if (foundVenue) {
            setVenue(foundVenue);
          } else {
            setVenue(null);
          }
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch venue:', error);
        setLoading(false);
      }
    };

    fetchVenue();
  }, [venueId]);

  // SVG 확대/축소 기능
  const handleZoom = (delta: number, centerX?: number, centerY?: number) => {
    setSvgTransform((prev) => {
      const newScale = Math.max(0.1, Math.min(5, prev.scale + delta));

      if (centerX !== undefined && centerY !== undefined) {
        // 마우스 위치를 중심으로 확대/축소
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

  // 드래그 기능
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditMode) return; // 편집 모드에서는 드래그 비활성화

    setIsDragging(true);
    setDragStart({
      x: e.clientX - svgTransform.x,
      y: e.clientY - svgTransform.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isEditMode) return;

    setSvgTransform((prev) => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 마우스 휠 확대/축소 (shift 키와 함께)
  const handleWheel = (e: React.WheelEvent) => {
    // shift 키가 눌린 상태에서만 확대/축소
    if (!e.shiftKey) return;

    e.preventDefault();

    const rect = svgWrapperRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;

    handleZoom(delta, centerX, centerY);
  };

  const handleSVGUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const svgContent = reader.result as string;
      setVenue((prev) => (prev ? { ...prev, svgContent } : null));
      setIsEditMode(true);
      setTempZones([]);
    };
    reader.readAsText(file);
  };

  // SVG 요소 클릭 시 구역 설정
  const handleSVGElementClick = (e: Event, element: Element) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isEditMode) return;

    const existingId = element.getAttribute('id');
    const existingName = element.getAttribute('data-name');

    const name = prompt(
      existingName ? `구역 이름 수정 (현재: ${existingName})` : '구역 이름을 입력하세요',
      existingName || '',
    );

    if (name) {
      const id =
        existingId || `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // SVG 요소 스타일 적용
      element.setAttribute('fill', 'rgba(59, 130, 246, 0.7)');
      element.setAttribute('stroke', 'rgba(59, 130, 246, 1)');
      element.setAttribute('stroke-width', '2');
      element.setAttribute('id', id);
      element.setAttribute('data-name', name);
      element.setAttribute('data-zone-configured', 'true');

      // 임시 구역 목록에 추가/수정
      setTempZones((prev) => {
        const existing = prev.find((z) => z.id === id);
        if (existing) {
          return prev.map((z) => (z.id === id ? { ...z, name, svgElementId: id } : z));
        } else {
          return [
            ...prev,
            {
              id,
              name,
              svgElementId: id,
              seatCount: 0, // 기본값
              priceRange: { min: 50000, max: 100000 }, // 기본값
            },
          ];
        }
      });
    }
  };

  // 구역 설정 저장
  const handleSaveZones = async () => {
    if (!venue) return;

    try {
      // TODO: API 호출로 구역 정보 저장
      const updatedVenue = {
        ...venue,
        zones: tempZones,
        lastModified: new Date().toISOString().split('T')[0],
      };

      setVenue(updatedVenue);
      setIsEditMode(false);
      setTempZones([]);

      alert('구역 설정이 저장되었습니다.');
    } catch (error) {
      console.error('Failed to save zones:', error);
      alert('구역 저장에 실패했습니다.');
    }
  };

  // 구역 설정 취소
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setTempZones([]);
    setSelectedZone(null);
    // SVG 다시 렌더링하여 기존 구역 복원
    if (venue?.svgContent && svgContainerRef.current) {
      // 모든 data-zone-configured 속성 제거
      const svgEl = svgContainerRef.current.querySelector('svg');
      if (svgEl) {
        svgEl.querySelectorAll('[data-zone-configured]').forEach((element) => {
          element.removeAttribute('data-zone-configured');
          element.removeAttribute('data-name');
          // 원래 스타일로 복원
          element.setAttribute('fill', 'rgba(107, 114, 128, 0.3)');
          element.setAttribute('stroke', 'rgba(0, 0, 0, 0.3)');
          element.setAttribute('stroke-width', '1');
        });
      }
      renderSVG();
    }
  };

  // SVG 렌더링 및 이벤트 설정
  const renderSVG = () => {
    if (!venue?.svgContent || !svgContainerRef.current) return;

    svgContainerRef.current.innerHTML = venue.svgContent;
    const svgEl = svgContainerRef.current.querySelector('svg');

    if (svgEl) {
      // 기존 이벤트 리스너 제거를 위해 클론 생성
      const newSvgEl = svgEl.cloneNode(true) as SVGElement;
      svgEl.parentNode?.replaceChild(newSvgEl, svgEl);

      // 편집 모드일 때
      if (isEditMode) {
        // 모든 SVG 요소에 클릭 이벤트 추가 (text 요소 제외)
        newSvgEl
          .querySelectorAll('polygon, rect, path, circle, ellipse, g')
          .forEach((element) => {
            // text 요소나 text를 포함한 요소는 제외
            if (
              element.tagName.toLowerCase() === 'text' ||
              element.querySelector('text') ||
              element.closest('text')
            ) {
              return;
            }

            // 이미 설정된 구역인지 확인
            const isAlreadyConfigured =
              element.getAttribute('data-zone-configured') === 'true';

            const clickHandler = (e: Event) => {
              handleSVGElementClick(e, element);
            };

            element.addEventListener('click', clickHandler, { once: false });

            // 호버 효과
            element.addEventListener('mouseenter', () => {
              if (!isAlreadyConfigured) {
                element.setAttribute('opacity', '0.8');
                (element as HTMLElement).style.cursor = 'pointer';
              }
            });

            element.addEventListener('mouseleave', () => {
              if (!isAlreadyConfigured) {
                element.setAttribute('opacity', '1');
              }
            });

            // 기본 스타일 설정
            if (!isAlreadyConfigured) {
              element.setAttribute(
                'fill',
                element.getAttribute('fill') || 'rgba(107, 114, 128, 0.3)',
              );
              element.setAttribute(
                'stroke',
                element.getAttribute('stroke') || 'rgba(0, 0, 0, 0.3)',
              );
              element.setAttribute(
                'stroke-width',
                element.getAttribute('stroke-width') || '1',
              );
            }
          });
      } else {
        // 일반 모드일 때 - 기존 구역들만 클릭 가능
        venue.zones.forEach((zone) => {
          const element = newSvgEl.querySelector(`#${zone.svgElementId}`);
          if (element) {
            const clickHandler = () => {
              setSelectedZone(zone.id);
            };

            element.addEventListener('click', clickHandler);

            element.addEventListener('mouseenter', () => {
              element.setAttribute('fill', 'rgba(59, 130, 246, 0.7)');
              (element as HTMLElement).style.cursor = 'pointer';
            });

            element.addEventListener('mouseleave', () => {
              if (selectedZone !== zone.id) {
                element.setAttribute('fill', 'rgba(107, 114, 128, 0.5)');
              }
            });

            // 초기 스타일 설정
            element.setAttribute(
              'fill',
              selectedZone === zone.id
                ? 'rgba(59, 130, 246, 0.7)'
                : 'rgba(107, 114, 128, 0.5)',
            );
            element.setAttribute('stroke', 'rgba(0, 0, 0, 0.3)');
            element.setAttribute('stroke-width', '1');
          }
        });
      }
    }
  };

  useEffect(() => {
    renderSVG();
  }, [venue, selectedZone, isEditMode]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>공연장 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>공연장을 찾을 수 없습니다.</p>
          <Link href='/admin/venues' className={styles.backButton}>
            공연장 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const selectedZoneData = venue.zones.find((zone) => zone.id === selectedZone);
  const displayZones = isEditMode ? tempZones : venue.zones;

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href='/admin/venues' className={styles.backButton}>
            ← 목록으로
          </Link>
          <div>
            <h1 className={styles.title}>{venue.name}</h1>
            <p className={styles.subtitle}>{venue.location}</p>
            {venue.description && (
              <p className={styles.description}>{venue.description}</p>
            )}
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.statusBadge} data-status={venue.status}>
            {venue.status === 'active'
              ? '활성'
              : venue.status === 'draft'
                ? '임시저장'
                : '보관됨'}
          </div>
          <Link
            href={`/admin/venues/${venueId}/preview`}
            className={styles.previewButton}
          >
            전체 미리보기
          </Link>
          <Link href={`/admin/venues/${venueId}/zones`} className={styles.manageButton}>
            구역 관리
          </Link>
        </div>
      </div>

      <div className={styles.content}>
        {/* SVG 뷰어 */}
        <div className={styles.svgSection}>
          <div className={styles.svgHeader}>
            <div className={styles.svgHeaderLeft}>
              <h2>공연장 레이아웃</h2>
              {isEditMode ? (
                <p>SVG 도형 요소를 클릭하여 구역을 설정하세요 (텍스트 제외)</p>
              ) : venue.svgContent ? (
                <p>Shift + 마우스휠로 확대/축소, 드래그로 이동 가능합니다</p>
              ) : (
                <p>SVG 파일을 업로드하여 공연장 레이아웃을 설정하세요</p>
              )}
            </div>

            <div className={styles.svgActions}>
              {!venue.svgContent ? (
                // SVG 업로드
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
                // 편집 모드 버튼들
                <div className={styles.editActions}>
                  <button onClick={handleCancelEdit} className={styles.cancelButton}>
                    취소
                  </button>
                  <button onClick={handleSaveZones} className={styles.saveButton}>
                    저장
                  </button>
                </div>
              ) : (
                // 일반 모드 버튼들
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
                      title='원본 크기'
                    >
                      🔄
                    </button>
                  </div>
                  <label className={styles.reuploadButton}>
                    🔄 다시 업로드
                    <input
                      type='file'
                      accept='.svg'
                      onChange={handleSVGUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className={styles.editButton}
                  >
                    ✏️ 구역 편집
                  </button>
                </div>
              )}
            </div>
          </div>

          {venue.svgContent ? (
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
                  💡 SVG의 도형 요소들을 클릭하여 구역으로 설정할 수 있습니다 (텍스트는
                  제외됩니다)
                </div>
              )}

              {!isEditMode && venue.svgContent && (
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

        {/* 구역 정보 패널 */}
        <div className={styles.infoPanel}>
          <h2>구역 정보</h2>

          {selectedZoneData && !isEditMode ? (
            <div className={styles.zoneDetail}>
              <div className={styles.zoneHeader}>
                <h3>{selectedZoneData.name}</h3>
                <div className={styles.zoneActions}>
                  <Link
                    href={`/admin/venues/${venueId}/zones/${selectedZoneData.id}`}
                    className={styles.detailButton}
                  >
                    상세보기
                  </Link>
                  <Link
                    href={`/admin/venues/${venueId}/zones/${selectedZoneData.id}/editor`}
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
                  <span className={styles.statValue}>
                    {selectedZoneData.priceRange.min.toLocaleString()}원 ~{' '}
                    {selectedZoneData.priceRange.max.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          ) : isEditMode ? (
            <div className={styles.editModeInfo}>
              <h3>🔧 구역 편집 모드</h3>
              <p>SVG 요소를 클릭하여 구역으로 설정하세요</p>
              <div className={styles.tempZoneCount}>
                설정된 구역: {tempZones.length}개
              </div>
            </div>
          ) : (
            <div className={styles.noSelection}>
              <p>구역을 선택해주세요</p>
            </div>
          )}

          {/* 구역 목록 */}
          {displayZones.length > 0 && (
            <div className={styles.zoneList}>
              <h3>{isEditMode ? '설정 중인 구역' : '전체 구역'}</h3>
              <div className={styles.zones}>
                {displayZones.map((zone) => (
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
                      <p className={styles.zoneId}>ID: {zone.svgElementId}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 정보 섹션 */}
      {!isEditMode && (
        <div className={styles.infoSection}>
          <div className={styles.infoCard}>
            <h3>공연장 정보</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>생성일</span>
                <span className={styles.infoValue}>{venue.createdAt}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>수정일</span>
                <span className={styles.infoValue}>{venue.lastModified}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>층수</span>
                <span className={styles.infoValue}>{venue.floorCount}층</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>총 좌석 수</span>
                <span className={styles.infoValue}>{venue.totalSeats}석</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>총 구역 수</span>
                <span className={styles.infoValue}>{venue.zones.length}개</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>태그</span>
                <span className={styles.infoValue}>
                  {venue.tags.map((tag, index) => (
                    <span key={index} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
