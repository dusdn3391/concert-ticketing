import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import styles from '../concertCreate/concertCreate.module.css';
import PostcodeModal from '../concertCreate/PostcodeModal';
import Link from 'next/link';

declare global {
  interface Window {
    kakao: any;
  }
}

interface ConcertRound {
  id: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
}

interface DisplayImage {
  imageUrl: string; // 미리보기/서버 이미지 URL
  imagesRole: 'THUMBNAIL' | 'DETAIL';
  file?: File; // 새로 업로드 하는 경우만 파일 존재
}

interface ConcertFormData {
  title: string;
  description: string;
  location: string;
  locationX: number | null;
  locationY: number | null;
  concertRounds: ConcertRound[];
  reservationStartDate: string; // input용 로컬 datetime (YYYY-MM-DDTHH:mm)
  reservationEndDate: string; // input용 로컬 datetime
  price: string;
  limitAge: number;
  durationTime: number;
  thumbnailFile: File | null;
  descriptionFiles: File[];
  images: DisplayImage[]; // 기존+새 파일 미리보기
}

interface FormErrors {
  title?: string;
  description?: string;
  location?: string;
  concertRounds?: string;
  reservationStartDate?: string;
  reservationEndDate?: string;
  price?: string;
  limitAge?: string;
  durationTime?: string;
  images?: string;
}

interface AddressResult {
  address: string;
  roadAddress?: string;
  jibunAddress?: string;
  zonecode: string;
  buildingName?: string;
}

export default function ConcertEdit() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  // ------------ 상태 ------------
  const [formData, setFormData] = useState<ConcertFormData>({
    title: '',
    description: '',
    location: '',
    locationX: null,
    locationY: null,
    concertRounds: [],
    reservationStartDate: '',
    reservationEndDate: '',
    price: '',
    limitAge: 0,
    durationTime: 0,
    thumbnailFile: null,
    descriptionFiles: [],
    images: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [showPostcodeModal, setShowPostcodeModal] = useState(false);
  const [baseAddress, setBaseAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [isLoadingCoords, setIsLoadingCoords] = useState(false);
  const [isKakaoMapsLoaded, setIsKakaoMapsLoaded] = useState(false);
  const [isSdkLoading, setIsSdkLoading] = useState(false);

  // ------------ 유틸 ------------
  const toISO = (date: string, time: string) => `${date}T${time}:00`;
  const addMinutesISO = (iso: string, minutes: number) => {
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() + minutes);
    return d.toISOString();
  };

  const toInputLocalDateTime = (isoLike?: string | null) => {
    if (!isoLike) return '';
    const d = new Date(isoLike);
    // YYYY-MM-DDTHH:mm (로컬)
    const pad = (n: number) => `${n}`.padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const fromInputLocalDateTimeToISO = (local: string) => {
    // 사용자가 입력한 로컬 시간을 ISO로 변환
    // new Date(local) 는 로컬 기준 → ISO 문자열로 저장
    return local ? new Date(local).toISOString() : '';
  };

  const updateFormData = <K extends keyof ConcertFormData>(
    field: K,
    value: ConcertFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const sortRoundsByDateTime = (rounds: ConcertRound[]): ConcertRound[] => {
    return [...rounds].sort((a, b) => {
      if (!a.date || !a.startTime || !b.date || !b.startTime) return 0;
      return (
        new Date(`${a.date}T${a.startTime}`).getTime() -
        new Date(`${b.date}T${b.startTime}`).getTime()
      );
    });
  };

  const formatRoundDateTime = (date: string, startTime: string): string => {
    if (!date || !startTime) return '';
    const dt = new Date(`${date}T${startTime}`);
    return dt.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getThumbnailImage = () =>
    formData.images.find((img) => img.imagesRole === 'THUMBNAIL');
  const getEarliestRound = () => {
    const valid = formData.concertRounds.filter((r) => r.date && r.startTime);
    if (valid.length === 0) return null;
    return sortRoundsByDateTime(valid)[0];
  };

  // ------------ 이미지 업로드 ------------
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;
      const newThumb: DisplayImage = { imageUrl, imagesRole: 'THUMBNAIL', file };

      const details = formData.images.filter((img) => img.imagesRole !== 'THUMBNAIL');
      updateFormData('images', [newThumb, ...details]);
      updateFormData('thumbnailFile', file);
    };
    reader.readAsDataURL(file);
  };

  const handleDetailImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;
      const newImg: DisplayImage = { imageUrl, imagesRole: 'DETAIL', file };
      updateFormData('images', [...formData.images, newImg]);
      updateFormData('descriptionFiles', [...formData.descriptionFiles, file]);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    const target = formData.images[index];
    const next = formData.images.filter((_, i) => i !== index);
    updateFormData('images', next);

    if (target?.imagesRole === 'THUMBNAIL') updateFormData('thumbnailFile', null);
    if (target?.imagesRole === 'DETAIL' && target.file) {
      updateFormData(
        'descriptionFiles',
        formData.descriptionFiles.filter((f) => f !== target.file),
      );
    }
  };

  // ------------ Kakao Maps ------------
  const loadKakaoMapsSDK = async (): Promise<void> =>
    new Promise((resolve, reject) => {
      if (window.kakao?.maps?.services) {
        setIsKakaoMapsLoaded(true);
        resolve();
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
      if (!apiKey) {
        reject(new Error('Kakao Maps API 키가 없습니다'));
        return;
      }

      setIsSdkLoading(true);

      const exists = document.querySelector('script[src*="dapi.kakao.com"]');
      if (exists) {
        const iv = setInterval(() => {
          if (window.kakao?.maps?.services) {
            clearInterval(iv);
            setIsKakaoMapsLoaded(true);
            setIsSdkLoading(false);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(iv);
          setIsSdkLoading(false);
          reject(new Error('SDK 로드 타임아웃'));
        }, 10000);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`;
      script.async = true;
      script.onload = () => {
        if (window.kakao?.maps) {
          window.kakao.maps.load(() => {
            if (window.kakao.maps.services) {
              setIsKakaoMapsLoaded(true);
              setIsSdkLoading(false);
              resolve();
            } else {
              setIsSdkLoading(false);
              reject(new Error('Kakao Maps Services 로드 실패'));
            }
          });
        } else {
          setIsSdkLoading(false);
          reject(new Error('Kakao Maps 객체 없음'));
        }
      };
      script.onerror = () => {
        setIsSdkLoading(false);
        reject(new Error('Kakao Maps SDK 로드 실패'));
      };
      document.head.appendChild(script);
    });

  const convertAddressToCoordinates = async (fullAddress: string) =>
    new Promise<{ lat: number; lng: number } | null>(async (resolve) => {
      try {
        if (!isKakaoMapsLoaded) await loadKakaoMapsSDK();
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(fullAddress, (result: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
            resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
          } else {
            resolve(null);
          }
        });
      } catch (e) {
        console.error('좌표 변환 오류:', e);
        resolve(null);
      }
    });

  const updateCoordinates = async () => {
    if (!baseAddress) {
      updateFormData('locationX', null);
      updateFormData('locationY', null);
      return;
    }
    setIsLoadingCoords(true);
    const fullAddress = detailAddress ? `${baseAddress} ${detailAddress}` : baseAddress;
    try {
      const coords = await convertAddressToCoordinates(fullAddress);
      if (coords) {
        updateFormData('locationX', coords.lng);
        updateFormData('locationY', coords.lat);
        updateFormData('location', fullAddress);
      } else {
        updateFormData('locationX', null);
        updateFormData('locationY', null);
      }
    } finally {
      setIsLoadingCoords(false);
    }
  };

  useEffect(() => {
    if (!baseAddress) return;
    const t = setTimeout(updateCoordinates, 500);
    return () => clearTimeout(t);
  }, [baseAddress, detailAddress]); // eslint-disable-line

  const handleAddressSelect = (addr: AddressResult) => {
    const selected = addr.roadAddress || addr.address;
    setBaseAddress(selected);
    setDetailAddress('');
    setShowPostcodeModal(false);
  };

  const handleDetailAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetailAddress(e.target.value);
  };

  // ------------ 유효성 검사 ------------
  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.title.trim()) newErrors.title = '콘서트 제목을 입력해주세요.';
    else if (formData.title.length < 2) newErrors.title = '최소 2글자 이상';
    else if (formData.title.length > 50) newErrors.title = '최대 50글자';

    if (!formData.description.trim()) newErrors.description = '설명을 입력해주세요.';
    else if (formData.description.length < 10) newErrors.description = '최소 10글자 이상';
    else if (formData.description.length > 500) newErrors.description = '최대 500글자';

    if (!formData.location.trim()) newErrors.location = '위치를 입력해주세요.';

    if (formData.concertRounds.length === 0) {
      newErrors.concertRounds = '최소 1개의 회차가 필요합니다.';
    } else {
      for (let i = 0; i < formData.concertRounds.length; i++) {
        const r = formData.concertRounds[i];
        if (!r.date || !r.startTime) {
          newErrors.concertRounds = `${i + 1}회차의 날짜/시간을 입력해주세요.`;
          break;
        }
        const dt = new Date(`${r.date}T${r.startTime}`);
        if (formData.reservationEndDate) {
          const end = new Date(formData.reservationEndDate);
          if (dt <= end) {
            newErrors.concertRounds = `${i + 1}회차는 예매 종료 이후여야 합니다.`;
            break;
          }
        }
      }
      const dts = formData.concertRounds
        .filter((r) => r.date && r.startTime)
        .map((r) => `${r.date}T${r.startTime}`);
      const dup = dts.filter((v, i) => dts.indexOf(v) !== i);
      if (dup.length > 0) newErrors.concertRounds = '동일한 회차가 존재합니다.';
    }

    if (!formData.reservationStartDate)
      newErrors.reservationStartDate = '예매 시작일시 필요';
    if (!formData.reservationEndDate) newErrors.reservationEndDate = '예매 종료일시 필요';

    if (formData.reservationStartDate && formData.reservationEndDate) {
      const st = new Date(formData.reservationStartDate);
      const ed = new Date(formData.reservationEndDate);
      if (st >= ed) newErrors.reservationEndDate = '종료일시는 시작 이후여야 합니다.';
    }

    if (!formData.price.trim()) newErrors.price = '가격을 입력해주세요.';
    if (formData.limitAge < 0) newErrors.limitAge = '연령 제한은 0 이상';
    if (formData.durationTime <= 0) newErrors.durationTime = '공연 시간을 입력해주세요.';
    if (formData.images.length === 0)
      newErrors.images = '최소 1개의 이미지가 필요합니다.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ------------ 데이터 불러오기(EDIT 전용) ------------
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setPageLoading(true);
        setPageError(null);
        const token = localStorage.getItem('admin_token');
        const res = await fetch(`http://localhost:8080/api/concerts/${id}`, {
          method: 'GET',
          headers: {
            Accept: '*/*',
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error('콘서트 정보를 불러오지 못했습니다.');
        const data = await res.json();

        // 회차 매핑: concertRounds 우선, 없으면 schedules → 회차로 역매핑
        // 회차 매핑: concertRounds 우선, 없으면 schedules → 회차로 역매핑
        let rounds: ConcertRound[] = [];
        if (Array.isArray(data.concertRounds) && data.concertRounds.length > 0) {
          rounds = data.concertRounds.map((r: any, idx: number) => ({
            id: r.id ?? idx,
            date:
              r.date ??
              (r.startTime ? new Date(r.startTime).toISOString().slice(0, 10) : ''),
            startTime:
              r.startTime && typeof r.startTime === 'string' && r.startTime.length === 5
                ? r.startTime
                : r.startTime
                  ? new Date(r.startTime)
                      .toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })
                      .slice(0, 5)
                  : '',
          }));
        } else if (Array.isArray(data.schedules)) {
          rounds = data.schedules.map((s: any, idx: number) => {
            // ✅ concertTime 우선 사용, 없으면 startTime/ time 등 fallback
            const iso = s.concertTime ?? s.startTime ?? s.time ?? null;
            const pad = (n: number) => `${n}`.padStart(2, '0');

            if (!iso) {
              return { id: s.id ?? idx, date: '', startTime: '' };
            }

            const d = new Date(iso);
            return {
              id: s.id ?? idx,
              date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
              startTime: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
            };
          });
        }

        // 이미지 매핑
        const mappedImages: DisplayImage[] = Array.isArray(data.images)
          ? data.images.map((img: any) => ({
              imageUrl: img.imageUrl ?? img.url ?? '',
              imagesRole: img.imagesRole ?? img.role ?? 'DETAIL',
            }))
          : [];

        setFormData({
          title: data.title ?? '',
          description: data.description ?? '',
          location: data.location ?? '',
          locationX: data.locationX ?? data.location_x ?? null,
          locationY: data.locationY ?? data.location_y ?? null,
          concertRounds: rounds,
          reservationStartDate: toInputLocalDateTime(
            data.reservationStartDate ?? data.reservation_start_date,
          ),
          reservationEndDate: toInputLocalDateTime(
            data.reservationEndDate ?? data.reservation_end_date,
          ),
          price: data.price ?? '',
          limitAge: Number(data.limitAge ?? 0),
          durationTime: Number(data.durationTime ?? 0),
          thumbnailFile: null,
          descriptionFiles: [],
          images: mappedImages,
        });

        // 주소 초기값(단순 세팅)
        setBaseAddress(data.location ?? '');
        setDetailAddress('');
      } catch (e: any) {
        setPageError(e?.message || '알 수 없는 오류');
      } finally {
        setPageLoading(false);
      }
    })();
  }, [id]);

  // ------------ 제출(수정 전용) ------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !id) return;

    try {
      setIsSubmitting(true);

      // 회차 정렬 + schedules 생성
      const rounds = sortRoundsByDateTime(
        formData.concertRounds.filter((r) => r.date && r.startTime),
      );
      const schedules = rounds.map((r, idx) => {
        const startISO = new Date(toISO(r.date, r.startTime)).toISOString();
        const endISO = addMinutesISO(startISO, formData.durationTime || 0);
        return { id: idx, startTime: startISO, endTime: endISO };
      });

      const requestBody = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        locationX: formData.locationX || 0,
        locationY: formData.locationY || 0,
        reservationStartDate: fromInputLocalDateTimeToISO(formData.reservationStartDate),
        reservationEndDate: fromInputLocalDateTimeToISO(formData.reservationEndDate),
        price: formData.price,
        limitAge: formData.limitAge,
        durationTime: formData.durationTime,
        concertRounds: rounds.map((r) => ({ date: r.date, startTime: r.startTime })),
        schedules,
      };

      const fd = new FormData();
      fd.append(
        'concertRequest',
        new Blob([JSON.stringify(requestBody)], { type: 'application/json' }),
      );

      if (formData.thumbnailFile) {
        fd.append('images', formData.thumbnailFile);
      }
      if (formData.descriptionFiles.length > 0) {
        formData.descriptionFiles.forEach((f) => fd.append('images', f));
      }

      const token = localStorage.getItem('admin_token');
      const res = await fetch(`http://localhost:8080/api/concerts/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        } as any,
        body: fd,
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || '콘서트 수정 실패');
      }

      alert('콘서트가 성공적으로 수정되었습니다!');
      router.push('/admin/concerts');
    } catch (error: any) {
      console.error('❌ 콘서트 수정 실패:', error);
      alert(`수정 중 오류: ${error?.message || '알 수 없는 오류'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ------------ 렌더링 ------------
  if (pageLoading) {
    return (
      <div className={styles.container}>
        <p>불러오는 중...</p>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>❌</div>
          <h3>오류가 발생했습니다</h3>
          <p>{pageError}</p>
          <div className={styles.errorActions}>
            <button onClick={() => router.reload()} className={styles.retryButton}>
              다시 시도
            </button>
            <Link href='/admin/concerts' className={styles.backButton}>
              콘서트 목록으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 프리뷰 카드 */}
        <div className={styles.previewSection}>
          <div className={styles.previewCard}>
            <div className={styles.previewThumbnail}>
              {getThumbnailImage() ? (
                <Image
                  src={getThumbnailImage()!.imageUrl}
                  alt='콘서트 썸네일'
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '8px',
                  }}
                  width={200}
                  height={200}
                />
              ) : (
                <span className={styles.placeholder}>썸네일 이미지</span>
              )}
            </div>

            <div className={styles.previewInfo}>
              <h4 className={styles.previewName}>{formData.title || '콘서트 제목'}</h4>
              <p className={styles.previewLocation}>
                📍 {formData.location || '위치를 입력하세요'}
              </p>
              <p className={styles.previewDescription}>
                {formData.description || '설명을 입력하세요...'}
              </p>

              <div className={styles.previewStats}>
                {formData.concertRounds.length > 0 && (
                  <span className={styles.previewStat}>
                    📅 {formData.concertRounds.length}회차
                  </span>
                )}
                {(() => {
                  const earliestRound = getEarliestRound();
                  return earliestRound ? (
                    <span className={styles.previewStat}>
                      🎭{' '}
                      {formatRoundDateTime(earliestRound.date, earliestRound.startTime)}
                    </span>
                  ) : null;
                })()}
                {formData.price && (
                  <span className={styles.previewStat}>💰 {formData.price}</span>
                )}
                {formData.durationTime > 0 && (
                  <span className={styles.previewStat}>⏱️ {formData.durationTime}분</span>
                )}
                {formData.limitAge > 0 && (
                  <span className={styles.previewStat}>
                    🔞 {formData.limitAge}세 이상
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 입력 폼 */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* 기본 정보 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>기본 정보 (수정)</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  콘서트 제목 <span className={styles.required}>*</span>
                </label>
                <input
                  type='text'
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder='예: BTS World Tour'
                  className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
                  maxLength={50}
                />
                {errors.title && (
                  <span className={styles.errorMessage}>{errors.title}</span>
                )}
                <span className={styles.inputHint}>{formData.title.length}/50</span>
              </div>

              {/* 주소 */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  주소 <span className={styles.required}>*</span>
                </label>
                <div className={styles.addressInputGroup}>
                  <input
                    type='text'
                    value={baseAddress}
                    onClick={() => setShowPostcodeModal(true)}
                    placeholder='클릭하여 주소 검색'
                    className={`${styles.input} ${styles.clickableInput} ${errors.location ? styles.inputError : ''}`}
                    readOnly
                  />
                </div>
                {baseAddress && (
                  <div style={{ marginTop: 8 }}>
                    <input
                      type='text'
                      value={detailAddress}
                      onChange={handleDetailAddressChange}
                      placeholder='상세 주소 (아파트명, 동호수 등)'
                      className={styles.input}
                      maxLength={100}
                    />
                  </div>
                )}
                {errors.location && (
                  <span className={styles.errorMessage}>{errors.location}</span>
                )}
                <div className={styles.inputHint}>
                  {!baseAddress
                    ? '주소를 정확히 입력하려면 클릭'
                    : `기본 주소: ${baseAddress}${detailAddress ? ` + 상세주소: ${detailAddress}` : ''}`}
                </div>
              </div>
            </div>

            {/* 설명 */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                설명 <span className={styles.required}>*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder='콘서트에 대한 자세한 설명...'
                className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
                rows={4}
                maxLength={500}
              />
              {errors.description && (
                <span className={styles.errorMessage}>{errors.description}</span>
              )}
              <span className={styles.inputHint}>{formData.description.length}/500</span>
            </div>
          </div>

          {/* 회차 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>콘서트 회차</h3>
            <div className={styles.formGroup}>
              <div className={styles.roundsContainer}>
                {sortRoundsByDateTime(formData.concertRounds).map((round) => (
                  <div key={round.id} className={styles.roundItem}>
                    <div className={styles.roundHeader}>
                      <span className={styles.roundNumber}>
                        {/* 순번은 정렬 순서로 표시되므로 생략 */}
                      </span>
                      {round.date && round.startTime && (
                        <span className={styles.roundDateTime}>
                          {formatRoundDateTime(round.date, round.startTime)}
                        </span>
                      )}
                      {formData.concertRounds.length > 1 && (
                        <button
                          type='button'
                          onClick={() =>
                            updateFormData(
                              'concertRounds',
                              formData.concertRounds.filter((r) => r.id !== round.id),
                            )
                          }
                          className={styles.removeRoundButton}
                          title='회차 삭제'
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className={styles.roundInputs}>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>공연 날짜 *</label>
                        <input
                          type='date'
                          title='date'
                          value={round.date}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) =>
                            updateFormData(
                              'concertRounds',
                              formData.concertRounds.map((r) =>
                                r.id === round.id ? { ...r, date: e.target.value } : r,
                              ),
                            )
                          }
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.formGroup}>
                        <label className={styles.label}>시작 시간 *</label>
                        <input
                          type='time'
                          title='time'
                          value={round.startTime}
                          onChange={(e) =>
                            updateFormData(
                              'concertRounds',
                              formData.concertRounds.map((r) =>
                                r.id === round.id
                                  ? { ...r, startTime: e.target.value }
                                  : r,
                              ),
                            )
                          }
                          className={styles.input}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type='button'
                  onClick={() =>
                    updateFormData('concertRounds', [
                      ...formData.concertRounds,
                      { id: Date.now(), date: '', startTime: '' },
                    ])
                  }
                  className={styles.addRoundButton}
                >
                  + 회차 추가
                </button>

                {errors.concertRounds && (
                  <span className={styles.errorMessage}>{errors.concertRounds}</span>
                )}

                <div className={styles.inputHint}>
                  회차는 시간 순서대로 자동 정렬됩니다.
                </div>
              </div>
            </div>
          </div>

          {/* 예매 일정 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>예매 일정</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  예매 시작일시 <span className={styles.required}>*</span>
                </label>
                <input
                  type='datetime-local'
                  title='datetime-local'
                  value={formData.reservationStartDate}
                  onChange={(e) => updateFormData('reservationStartDate', e.target.value)}
                  className={`${styles.input} ${errors.reservationStartDate ? styles.inputError : ''}`}
                />
                {errors.reservationStartDate && (
                  <span className={styles.errorMessage}>
                    {errors.reservationStartDate}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  예매 종료일시 <span className={styles.required}>*</span>
                </label>
                <input
                  type='datetime-local'
                  title='datetime-local'
                  value={formData.reservationEndDate}
                  onChange={(e) => updateFormData('reservationEndDate', e.target.value)}
                  className={`${styles.input} ${errors.reservationEndDate ? styles.inputError : ''}`}
                />
                {errors.reservationEndDate && (
                  <span className={styles.errorMessage}>{errors.reservationEndDate}</span>
                )}
              </div>
            </div>
          </div>

          {/* 상세 정보 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>상세 정보</h3>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  가격 <span className={styles.required}>*</span>
                </label>
                <input
                  type='text'
                  value={formData.price}
                  onChange={(e) => updateFormData('price', e.target.value)}
                  placeholder='예: 50,000원 ~ 150,000원'
                  className={`${styles.input} ${errors.price ? styles.inputError : ''}`}
                />
                {errors.price && (
                  <span className={styles.errorMessage}>{errors.price}</span>
                )}
                <div className={styles.inputHint}>티켓 가격 범위를 입력하세요</div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  공연 시간 (분) <span className={styles.required}>*</span>
                </label>
                <input
                  type='number'
                  value={formData.durationTime}
                  onChange={(e) =>
                    updateFormData('durationTime', parseInt(e.target.value) || 0)
                  }
                  placeholder='120'
                  min='1'
                  className={`${styles.input} ${errors.durationTime ? styles.inputError : ''}`}
                />
                {errors.durationTime && (
                  <span className={styles.errorMessage}>{errors.durationTime}</span>
                )}
                <div className={styles.inputHint}>공연 시간을 분 단위로 입력</div>
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>연령 제한</label>
                <input
                  type='number'
                  value={formData.limitAge}
                  onChange={(e) =>
                    updateFormData('limitAge', parseInt(e.target.value) || 0)
                  }
                  placeholder='19'
                  min='0'
                  className={`${styles.input} ${errors.limitAge ? styles.inputError : ''}`}
                />
                {errors.limitAge && (
                  <span className={styles.errorMessage}>{errors.limitAge}</span>
                )}
                <div className={styles.inputHint}>최소 연령 (0은 전체 관람가)</div>
              </div>
            </div>
          </div>

          {/* 이미지 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>이미지</h3>

            {/* 썸네일 */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                썸네일 이미지 <span className={styles.required}>*</span>
              </label>
              <div className={styles.imageUploadSection}>
                {getThumbnailImage() ? (
                  <div className={styles.imagePreview}>
                    <Image
                      src={getThumbnailImage()!.imageUrl}
                      alt='썸네일 미리보기'
                      width={200}
                      height={200}
                      style={{ objectFit: 'cover' }}
                    />
                    <button
                      type='button'
                      onClick={() => {
                        const newImages = formData.images.filter(
                          (img) => img.imagesRole !== 'THUMBNAIL',
                        );
                        updateFormData('images', newImages);
                        updateFormData('thumbnailFile', null);
                      }}
                      className={styles.removeImageButton}
                      title='이미지 제거'
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className={styles.imageUploadBox}>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={handleImageUpload}
                      className={styles.imageInput}
                    />
                    <div className={styles.uploadContent}>
                      <div className={styles.uploadIcon}>📷</div>
                      <div className={styles.uploadText}>
                        <div>썸네일 이미지 업로드</div>
                        <div className={styles.uploadSubtext}>클릭하여 이미지 선택</div>
                      </div>
                    </div>
                  </label>
                )}
              </div>
              <div className={styles.inputHint}>최대 5MB (JPG, PNG, GIF)</div>
              {errors.images && (
                <span className={styles.errorMessage}>{errors.images}</span>
              )}
            </div>

            {/* 상세 이미지 */}
            <div className={styles.formGroup}>
              <label className={styles.label}>상세 이미지 추가</label>
              <div className={styles.imageUploadSection}>
                <label className={styles.imageUploadBox}>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleDetailImageUpload}
                    className={styles.imageInput}
                  />
                  <div className={styles.uploadContent}>
                    <div className={styles.uploadIcon}>🖼️</div>
                    <div className={styles.uploadText}>
                      <div>상세 이미지 업로드</div>
                      <div className={styles.uploadSubtext}>클릭하여 이미지 선택</div>
                    </div>
                  </div>
                </label>
              </div>
              <div className={styles.inputHint}>
                콘서트 상세 정보를 보여줄 추가 이미지 (선택)
              </div>
            </div>

            {/* 상세 이미지 목록 */}
            {formData.images.filter((img) => img.imagesRole === 'DETAIL').length > 0 && (
              <div className={styles.formGroup}>
                <label className={styles.label}>업로드된 상세 이미지</label>
                <div className={styles.additionalImages}>
                  {formData.images
                    .filter((img) => img.imagesRole === 'DETAIL')
                    .map((image, index) => (
                      <div key={index} className={styles.additionalImage}>
                        <Image
                          src={image.imageUrl}
                          alt={`상세 이미지 ${index + 1}`}
                          width={100}
                          height={100}
                          style={{ objectFit: 'cover' }}
                        />
                        <button
                          type='button'
                          onClick={() =>
                            removeImage(formData.images.findIndex((img) => img === image))
                          }
                          className={styles.removeImageButton}
                          title='이미지 제거'
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* 제출 */}
          <div className={styles.submitSection}>
            <div className={styles.submitButtons}>
              <Link href='/admin/concerts' className={styles.cancelButton}>
                취소
              </Link>

              <button
                type='submit'
                disabled={isSubmitting}
                className={styles.submitButton}
              >
                {isSubmitting ? (
                  <>
                    <span className={styles.spinner} />
                    수정 중...
                  </>
                ) : (
                  '콘서트 수정하기'
                )}
              </button>
            </div>

            <div className={styles.submitHint}>
              수정 후에도 추가 설정을 변경할 수 있습니다.
            </div>
          </div>
        </form>
      </div>

      {/* Daum 우편번호 검색 모달 */}
      {showPostcodeModal && (
        <PostcodeModal
          onAddressSelect={handleAddressSelect}
          onClose={() => setShowPostcodeModal(false)}
        />
      )}
    </div>
  );
}
