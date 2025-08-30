import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useVenueStore } from '@/stores/venue';
import styles from './concertCreate.module.css';
import PostcodeModal from './PostcodeModal';

declare global {
  interface Window {
    kakao: any;
  }
}

interface ConcertRound {
  id: number;
  date: string;
  startTime: string;
}

interface DisplayImage {
  imageUrl: string; // 미리보기용 Base64 URL
  imagesRole: 'THUMBNAIL' | 'DETAIL';
  file?: File; // 실제 업로드할 파일
}

interface ConcertFormData {
  title: string;
  description: string;
  location: string;
  locationX: number | null;
  locationY: number | null;
  concertRounds: ConcertRound[];
  reservationStartDate: string;
  reservationEndDate: string;
  price: string;
  limitAge: number;
  durationTime: number;
  thumbnailFile: File | null; // (보조) 썸네일 파일
  descriptionFiles: File[]; // (보조) 상세파일들
  images: DisplayImage[]; // 미리보기 + 파일 보관
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

// Daum 주소 선택 결과 인터페이스
interface AddressResult {
  address: string;
  roadAddress?: string;
  jibunAddress?: string;
  zonecode: string;
  buildingName?: string;
}

export default function ConcertCreate() {
  const router = useRouter();
  const { createConcert, loading, error } = useVenueStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPostcodeModal, setShowPostcodeModal] = useState(false);
  const [baseAddress, setBaseAddress] = useState('');
  const [detailAddress, setDetailAddress] = useState('');
  const [isLoadingCoords, setIsLoadingCoords] = useState(false);
  const [isKakaoMapsLoaded, setIsKakaoMapsLoaded] = useState(false);
  const [isSdkLoading, setIsSdkLoading] = useState(false);

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

  const toISO = (date: string, time: string) => `${date}T${time}:00`;
  const addMinutesISO = (iso: string, minutes: number) => {
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() + minutes);
    return d.toISOString();
  };

  const updateFormData = <K extends keyof ConcertFormData>(
    field: K,
    value: ConcertFormData[K],
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;
      const newImage: DisplayImage = {
        imageUrl,
        imagesRole: 'THUMBNAIL',
        file,
      };

      // 기존 썸네일 제거하고 교체
      const existingDetails = formData.images.filter(
        (img) => img.imagesRole !== 'THUMBNAIL',
      );
      updateFormData('images', [newImage, ...existingDetails]);
      updateFormData('thumbnailFile', file);
    };
    reader.readAsDataURL(file);
  };

  const handleDetailImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;
      const newImage: DisplayImage = {
        imageUrl,
        imagesRole: 'DETAIL',
        file,
      };

      updateFormData('images', [...formData.images, newImage]);
      updateFormData('descriptionFiles', [...formData.descriptionFiles, file]);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number): void => {
    const toRemove = formData.images[index];
    const newImages = formData.images.filter((_, i) => i !== index);
    updateFormData('images', newImages);

    if (toRemove?.imagesRole === 'THUMBNAIL') {
      updateFormData('thumbnailFile', null);
    } else if (toRemove?.imagesRole === 'DETAIL' && toRemove.file) {
      updateFormData(
        'descriptionFiles',
        formData.descriptionFiles.filter((f) => f !== toRemove.file),
      );
    }
  };

  const loadKakaoMapsSDK = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
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

      const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
      if (existingScript) {
        const checkInterval = setInterval(() => {
          if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
            clearInterval(checkInterval);
            setIsKakaoMapsLoaded(true);
            setIsSdkLoading(false);
            resolve();
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkInterval);
          setIsSdkLoading(false);
          reject(new Error('SDK 로드 타임아웃'));
        }, 10000);
        return;
      }

      const scriptUrl = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`;
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = scriptUrl;
      script.async = true;

      script.onload = () => {
        if (window.kakao && window.kakao.maps) {
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
  };

  const convertAddressToCoordinates = async (
    fullAddress: string,
  ): Promise<{ lat: number; lng: number } | null> => {
    return new Promise(async (resolve) => {
      try {
        if (!isKakaoMapsLoaded) {
          await loadKakaoMapsSDK();
        }
        if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
          resolve(null);
          return;
        }

        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(fullAddress, (result: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
            const coords = { lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) };
            resolve(coords);
          } else {
            geocoder.addressSearch(baseAddress, (result2: any, status2: any) => {
              if (
                status2 === window.kakao.maps.services.Status.OK &&
                result2.length > 0
              ) {
                const coords2 = {
                  lat: parseFloat(result2[0].y),
                  lng: parseFloat(result2[0].x),
                };
                resolve(coords2);
              } else {
                resolve(null);
              }
            });
          }
        });
      } catch (error) {
        console.error('좌표 변환 오류:', error);
        resolve(null);
      }
    });
  };

  const updateCoordinates = async () => {
    if (!baseAddress) {
      updateFormData('locationX', null);
      updateFormData('locationY', null);
      return;
    }

    setIsLoadingCoords(true);
    const fullAddress = detailAddress ? `${baseAddress} ${detailAddress}` : baseAddress;

    try {
      const coordinates = await convertAddressToCoordinates(fullAddress);
      if (coordinates) {
        updateFormData('locationX', coordinates.lng);
        updateFormData('locationY', coordinates.lat);
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
    const timeoutId = setTimeout(() => {
      updateCoordinates();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [baseAddress, detailAddress]); // eslint-disable-line

  const handleAddressSelect = (addressData: AddressResult) => {
    const selectedAddress = addressData.roadAddress || addressData.address;
    setBaseAddress(selectedAddress);
    setDetailAddress('');
    setShowPostcodeModal(false);
  };

  const handleDetailAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDetailAddress(value);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) newErrors.title = '콘서트 제목을 입력해주세요.';
    else if (formData.title.length < 2)
      newErrors.title = '콘서트 제목은 최소 2글자 이상이어야 합니다.';
    else if (formData.title.length > 50)
      newErrors.title = '콘서트 제목은 최대 50글자까지 입력 가능합니다.';

    if (!formData.description.trim()) newErrors.description = '설명을 입력해주세요.';
    else if (formData.description.length < 10)
      newErrors.description = '설명은 최소 10글자 이상 입력해주세요.';
    else if (formData.description.length > 500)
      newErrors.description = '설명은 최대 500글자까지 입력 가능합니다.';

    if (!formData.location.trim()) newErrors.location = '위치를 입력해주세요.';

    if (formData.concertRounds.length === 0) {
      newErrors.concertRounds = '최소 1개의 콘서트 회차를 추가해주세요.';
    } else {
      for (let i = 0; i < formData.concertRounds.length; i++) {
        const round = formData.concertRounds[i];
        if (!round.date || !round.startTime) {
          newErrors.concertRounds = `${i + 1}회차의 날짜와 시간을 모두 입력해주세요.`;
          break;
        }
        const concertDateTime = new Date(`${round.date}T${round.startTime}`);
        const now = new Date();
        if (concertDateTime <= now) {
          newErrors.concertRounds = `${i + 1}회차의 공연일시는 현재 시간보다 늦어야 합니다.`;
          break;
        }
        if (formData.reservationEndDate) {
          const reservationEndDateTime = new Date(formData.reservationEndDate);
          if (concertDateTime <= reservationEndDateTime) {
            newErrors.concertRounds = `${i + 1}회차의 공연일시는 예매 종료일시보다 늦어야 합니다.`;
            break;
          }
        }
      }

      const dateTimeStrings = formData.concertRounds
        .filter((round) => round.date && round.startTime)
        .map((round) => `${round.date}T${round.startTime}`);

      const duplicates = dateTimeStrings.filter(
        (dateTime, index) => dateTimeStrings.indexOf(dateTime) !== index,
      );
      if (duplicates.length > 0)
        newErrors.concertRounds = '동일한 날짜와 시간의 회차가 있습니다.';
    }

    if (!formData.reservationStartDate)
      newErrors.reservationStartDate = '예매 시작일시를 선택해주세요.';
    if (!formData.reservationEndDate)
      newErrors.reservationEndDate = '예매 종료일시를 선택해주세요.';

    if (formData.reservationStartDate && formData.reservationEndDate) {
      const start = new Date(formData.reservationStartDate);
      const end = new Date(formData.reservationEndDate);
      if (start >= end)
        newErrors.reservationEndDate = '예매 종료일시는 시작일시보다 늦어야 합니다.';
      const now = new Date();
      if (start < now)
        newErrors.reservationStartDate = '예매 시작일시는 현재 시간 이후여야 합니다.';
    }

    if (!formData.price.trim()) newErrors.price = '가격을 입력해주세요.';
    if (formData.limitAge < 0) newErrors.limitAge = '연령 제한은 0 이상이어야 합니다.';
    if (formData.durationTime <= 0) newErrors.durationTime = '공연 시간을 입력해주세요.';
    if (formData.images.length === 0)
      newErrors.images = '최소 1개의 이미지를 업로드해주세요.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sortRoundsByDateTime = (rounds: ConcertRound[]): ConcertRound[] => {
    return [...rounds].sort((a, b) => {
      if (!a.date || !a.startTime || !b.date || !b.startTime) return 0;
      const dateTimeA = new Date(`${a.date}T${a.startTime}`);
      const dateTimeB = new Date(`${b.date}T${b.startTime}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });
  };

  const formatRoundDateTime = (date: string, startTime: string): string => {
    if (!date || !startTime) return '';
    const dateTime = new Date(`${date}T${startTime}`);
    return dateTime.toLocaleString('ko-KR', {
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
    if (formData.concertRounds.length === 0) return null;
    const validRounds = formData.concertRounds.filter((r) => r.date && r.startTime);
    if (validRounds.length === 0) return null;
    const sortedRounds = sortRoundsByDateTime(validRounds);
    return sortedRounds[0];
  };

  // ⛳ handleSubmit 교체
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // 1) 회차 정렬
      const rounds = formData.concertRounds
        .filter((r) => r.date && r.startTime)
        .sort(
          (a, b) =>
            new Date(`${a.date}T${a.startTime}`).getTime() -
            new Date(`${b.date}T${b.startTime}`).getTime(),
        );

      // 2) ISO 문자열 배열
      const concertTimes = rounds.map((r) =>
        new Date(toISO(r.date, r.startTime)).toISOString(),
      );

      // 3) scheduleRequests 형태 (서버 전송 포맷)
      const scheduleRequests = concertTimes.map((ct) => ({ concertTime: ct }));

      // 4) 기간(YYYY-MM-DD)
      const startDate = rounds[0]?.date ?? '';
      const endDate = rounds.at(-1)?.date ?? '';

      // 5) 콘솔 디버깅 (클라이언트 단계)
      console.group('🧪 Schedule Build (Client)');
      console.log('raw formData.concertRounds:', formData.concertRounds);
      console.log('sorted rounds:', rounds);
      console.log('concertTimes (ISO):', concertTimes);
      console.table(scheduleRequests);
      console.groupEnd();

      // 6) 실제 createConcert에 넘길 payload (프리뷰)
      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        locationX: formData.locationX || 0,
        locationY: formData.locationY || 0,
        reservationStartDate: formData.reservationStartDate,
        reservationEndDate: formData.reservationEndDate,
        price: formData.price,
        limitAge: formData.limitAge,
        durationTime: formData.durationTime,
        concertRounds: formData.concertRounds, // 원본 회차도 그대로 전달
        schedules: scheduleRequests,
        startDate,
        endDate,
        thumbnailImage: formData.thumbnailFile || undefined,
        descriptionImages: formData.descriptionFiles || [],
      } as const;

      console.group('📤 createConcert(payload) call');
      console.log('payload preview:', {
        ...payload,
        thumbnailImage: payload.thumbnailImage ? '<<File>>' : null,
        descriptionImagesCount: payload.descriptionImages.length,
      });
      console.groupEnd();

      // ✅ 한 번만 호출!
      const newConcert = await createConcert(payload);
      console.log('✅ 콘서트 생성 성공:', newConcert);

      alert('콘서트가 성공적으로 생성되었습니다!');
      router.push('/admin/concerts');
    } catch (error) {
      console.error('❌ 콘서트 생성 실패:', error);
      alert(
        `콘서트 생성 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  return (
                    earliestRound && (
                      <span className={styles.previewStat}>
                        🎭{' '}
                        {formatRoundDateTime(earliestRound.date, earliestRound.startTime)}
                      </span>
                    )
                  );
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
            <h3 className={styles.sectionTitle}>기본 정보</h3>
            <div className={styles.formGrid}>
              {/* 콘서트 제목 */}
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

              {/* 주소 입력 */}
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
                  <div style={{ marginTop: '8px' }}>
                    <input
                      type='text'
                      value={detailAddress}
                      onChange={handleDetailAddressChange}
                      placeholder='상세 주소를 입력하세요 (아파트명, 동호수 등)'
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
                    ? '주소를 정확하게 입력하려면 클릭하세요'
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
                placeholder='콘서트에 대한 자세한 설명을 입력해주세요...'
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

          {/* 콘서트 회차 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>콘서트 회차</h3>

            <div className={styles.formGroup}>
              <div className={styles.roundsContainer}>
                {sortRoundsByDateTime(formData.concertRounds).map((round, index) => {
                  const originalIndex = formData.concertRounds.findIndex(
                    (r) => r.id === round.id,
                  );
                  return (
                    <div key={round.id} className={styles.roundItem}>
                      <div className={styles.roundHeader}>
                        <span className={styles.roundNumber}>{index + 1}회차</span>
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
                  );
                })}

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
                  각 회차별로 공연 날짜와 시작 시간을 설정하세요. 회차는 시간 순서대로
                  자동 정렬됩니다.
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
                  min={new Date().toISOString().slice(0, 16)}
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
                  min={
                    formData.reservationStartDate || new Date().toISOString().slice(0, 16)
                  }
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

          {/* 이미지 업로드 */}
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
                콘서트 상세 정보를 보여줄 추가 이미지 (선택사항)
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
                    생성 중...
                  </>
                ) : (
                  '콘서트 생성하기'
                )}
              </button>
            </div>

            <div className={styles.submitHint}>
              생성 후 추가 설정을 진행할 수 있습니다.
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
