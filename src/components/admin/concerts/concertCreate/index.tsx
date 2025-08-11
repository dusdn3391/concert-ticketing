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
  rating: number;
  limitAge: number;
  durationTime: number;
  concertTag: string;
  adminId: number;
  concertHallId: number;
  images: {
    imageUrl: string;
    imagesRole: 'THUMBNAIL' | 'DETAIL';
  }[];
}

interface FormErrors {
  title?: string;
  description?: string;
  location?: string;
  concertRounds?: string;
  reservationStartDate?: string;
  reservationEndDate?: string;
  price?: string;
  rating?: string;
  limitAge?: string;
  durationTime?: string;
  concertTag?: string;
  adminId?: string;
  concertHallId?: string;
  images?: string;
}

// Daum 주소 선택 결과 인터페이스
interface AddressResult {
  address: string; // 기본 주소 (도로명 또는 지번)
  roadAddress?: string; // 도로명 주소
  jibunAddress?: string; // 지번 주소
  zonecode: string; // 우편번호
  buildingName?: string; // 건물명
}

export default function ConcertCreate() {
  const router = useRouter();
  const createVenue = useVenueStore((state) => state.createVenue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPostcodeModal, setShowPostcodeModal] = useState(false);
  const [baseAddress, setBaseAddress] = useState(''); // 기본 주소 (도로명/지번)
  const [detailAddress, setDetailAddress] = useState(''); // 상세 주소
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
    rating: 0,
    limitAge: 0,
    durationTime: 0,
    concertTag: '',
    adminId: 1, // 기본값 설정, 실제로는 로그인된 관리자 ID
    concertHallId: 1, // 기본값 설정, 실제로는 선택된 콘서트홀 ID
    images: [],
  });

  const updateFormData = <K extends keyof ConcertFormData>(
    field: K,
    value: ConcertFormData[K],
  ): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // 에러 메시지 제거
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // 이미지 업로드 핸들러들
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        const newImage = {
          imageUrl,
          imagesRole: 'THUMBNAIL' as const,
        };

        // 기존 썸네일 이미지가 있다면 교체, 없다면 추가
        const existingImages = formData.images.filter(
          (img) => img.imagesRole !== 'THUMBNAIL',
        );
        updateFormData('images', [newImage, ...existingImages]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetailImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        const newImage = {
          imageUrl,
          imagesRole: 'DETAIL' as const,
        };

        // 상세 이미지 추가
        updateFormData('images', [...formData.images, newImage]);
      };
      reader.readAsDataURL(file);
    }
  };

  // 콘서트 회차 관련 함수들
  const addConcertRound = (): void => {
    const newRound: ConcertRound = {
      id: Date.now(), // 임시 ID
      date: '',
      startTime: '',
    };
    updateFormData('concertRounds', [...formData.concertRounds, newRound]);
  };

  const updateConcertRound = (
    id: number,
    field: keyof ConcertRound,
    value: string,
  ): void => {
    const updatedRounds = formData.concertRounds.map((round) => {
      return round.id === id ? { ...round, [field]: value } : round;
    });
    updateFormData('concertRounds', updatedRounds);
  };

  const removeConcertRound = (id: number): void => {
    const updatedRounds = formData.concertRounds.filter((round) => round.id !== id);
    updateFormData('concertRounds', updatedRounds);
  };

  const removeImage = (index: number): void => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateFormData('images', newImages);
  };

  // Kakao Maps SDK 로드 함수
  const loadKakaoMapsSDK = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
        setIsKakaoMapsLoaded(true);
        resolve();
        return;
      }

      // 환경변수에서 API 키 가져오기
      const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
      if (!apiKey) {
        reject(new Error('Kakao Maps API 키가 없습니다'));
        return;
      }

      setIsSdkLoading(true);

      const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
      if (existingScript) {
        console.log('🔄 이미 스크립트가 로드 중이거나 로드됨, 대기 중...');
        // 로드 완료까지 대기
        const checkInterval = setInterval(() => {
          if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
            clearInterval(checkInterval);
            setIsKakaoMapsLoaded(true);
            setIsSdkLoading(false);
            resolve();
          }
        }, 100);

        // 10초 후 타임아웃
        setTimeout(() => {
          clearInterval(checkInterval);
          setIsSdkLoading(false);
          reject(new Error('SDK 로드 타임아웃'));
        }, 10000);
        return;
      }

      // services 라이브러리 포함해서 SDK 로드
      const scriptUrl = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`;

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = scriptUrl;
      script.async = true;

      script.onload = () => {
        // autoload=false로 했으므로 수동으로 로드
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

      script.onerror = (error) => {
        setIsSdkLoading(false);
        reject(new Error('Kakao Maps SDK 로드 실패'));
      };

      document.head.appendChild(script);
    });
  };

  // 컴포넌트 마운트 시 SDK 로드 시도 (선택적)
  useEffect(() => {
    // 페이지 로드 시 바로 SDK를 로드할지, 아니면 필요할 때만 로드할지 선택
    // loadKakaoMapsSDK().catch(console.error);
  }, []);

  // 좌표 변환 함수 (SDK 로드 확인 추가)
  const convertAddressToCoordinates = async (
    fullAddress: string,
  ): Promise<{ lat: number; lng: number } | null> => {
    return new Promise(async (resolve) => {
      try {
        // SDK가 로드되지 않았다면 먼저 로드
        if (!isKakaoMapsLoaded) {
          await loadKakaoMapsSDK();
        }

        if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
          resolve(null);
          return;
        }

        const geocoder = new window.kakao.maps.services.Geocoder();

        // 먼저 전체 주소로 검색 시도
        geocoder.addressSearch(fullAddress, (result: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
            const coords = {
              lat: parseFloat(result[0].y),
              lng: parseFloat(result[0].x),
            };
            console.log('✅ 전체 주소 좌표 변환 성공:', coords);
            resolve(coords);
          } else {
            // 전체 주소 실패 시 기본 주소만으로 재시도
            console.log('⚠️ 전체 주소 검색 실패, 기본 주소로 재시도:', baseAddress);
            geocoder.addressSearch(baseAddress, (result: any, status: any) => {
              if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
                const coords = {
                  lat: parseFloat(result[0].y),
                  lng: parseFloat(result[0].x),
                };
                console.log('✅ 기본 주소 좌표 변환 성공:', coords);
                resolve(coords);
              } else {
                console.error('❌ 좌표 변환 완전 실패:', status);
                resolve(null);
              }
            });
          }
        });
      } catch (error) {
        console.error('💥 SDK 로드 또는 좌표 변환 중 오류:', error);
        resolve(null);
      }
    });
  };

  // 주소가 변경될 때마다 좌표 변환 실행
  const updateCoordinates = async () => {
    if (!baseAddress) {
      updateFormData('locationX', null);
      updateFormData('locationY', null);
      return;
    }

    setIsLoadingCoords(true);

    // 전체 주소 생성
    const fullAddress = detailAddress ? `${baseAddress} ${detailAddress}` : baseAddress;

    try {
      const coordinates = await convertAddressToCoordinates(fullAddress);

      if (coordinates) {
        updateFormData('locationX', coordinates.lng); // 경도
        updateFormData('locationY', coordinates.lat); // 위도

        // location 필드에 전체 주소 저장
        updateFormData('location', fullAddress);
      } else {
        updateFormData('locationX', null);
        updateFormData('locationY', null);
      }
    } catch (error) {
      console.error('💥 좌표 변환 중 오류:', error);
      updateFormData('locationX', null);
      updateFormData('locationY', null);
    } finally {
      setIsLoadingCoords(false);
    }
  };

  // 상세주소가 변경될 때마다 좌표 업데이트 (디바운싱 적용)
  useEffect(() => {
    if (!baseAddress) return;

    const timeoutId = setTimeout(() => {
      updateCoordinates();
    }, 500); // 500ms 디바운싱

    return () => clearTimeout(timeoutId);
  }, [baseAddress, detailAddress]);

  // 모달에서 주소 선택 시 호출되는 함수
  const handleAddressSelect = (addressData: AddressResult) => {
    // 도로명 주소가 있으면 도로명 주소를, 없으면 기본 주소 사용
    const selectedAddress = addressData.roadAddress || addressData.address;

    setBaseAddress(selectedAddress);
    setDetailAddress(''); // 상세 주소 초기화
    setShowPostcodeModal(false);
  };

  // 상세 주소 입력 핸들러
  const handleDetailAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDetailAddress(value);
  };

  // 폼 유효성 검사
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = '콘서트 제목을 입력해주세요.';
    } else if (formData.title.length < 2) {
      newErrors.title = '콘서트 제목은 최소 2글자 이상이어야 합니다.';
    } else if (formData.title.length > 50) {
      newErrors.title = '콘서트 제목은 최대 50글자까지 입력 가능합니다.';
    }

    if (!formData.description.trim()) {
      newErrors.description = '설명을 입력해주세요.';
    } else if (formData.description.length < 10) {
      newErrors.description = '설명은 최소 10글자 이상 입력해주세요.';
    } else if (formData.description.length > 500) {
      newErrors.description = '설명은 최대 500글자까지 입력 가능합니다.';
    }

    if (!formData.location.trim()) {
      newErrors.location = '위치를 입력해주세요.';
    }

    if (formData.concertRounds.length === 0) {
      newErrors.concertRounds = '최소 1개의 콘서트 회차를 추가해주세요.';
    } else {
      // 각 회차의 유효성 검사
      for (let i = 0; i < formData.concertRounds.length; i++) {
        const round = formData.concertRounds[i];
        if (!round.date || !round.startTime) {
          newErrors.concertRounds = `${i + 1}회차의 날짜와 시간을 모두 입력해주세요.`;
          break;
        }
      }
    }

    if (!formData.reservationStartDate) {
      newErrors.reservationStartDate = '예매 시작일시를 선택해주세요.';
    }

    if (!formData.reservationEndDate) {
      newErrors.reservationEndDate = '예매 종료일시를 선택해주세요.';
    }

    if (formData.reservationStartDate && formData.reservationEndDate) {
      const reservationStartDate = new Date(formData.reservationStartDate);
      const reservationEndDate = new Date(formData.reservationEndDate);
      if (reservationStartDate >= reservationEndDate) {
        newErrors.reservationEndDate = '예매 종료일시는 시작일시보다 늦어야 합니다.';
      }
    }

    if (!formData.price.trim()) {
      newErrors.price = '가격을 입력해주세요.';
    }

    if (formData.rating < 0 || formData.rating > 5) {
      newErrors.rating = '평점은 0~5 사이의 값이어야 합니다.';
    }

    if (formData.limitAge < 0) {
      newErrors.limitAge = '연령 제한은 0 이상이어야 합니다.';
    }

    if (formData.durationTime <= 0) {
      newErrors.durationTime = '공연 시간을 입력해주세요.';
    }

    if (formData.images.length === 0) {
      newErrors.images = '최소 1개의 이미지를 업로드해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const concertData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        locationX: formData.locationX || 0,
        locationY: formData.locationY || 0,
        concertRounds: formData.concertRounds,
        reservationStartDate: formData.reservationStartDate,
        reservationEndDate: formData.reservationEndDate,
        price: formData.price,
        rating: formData.rating,
        limitAge: formData.limitAge,
        durationTime: formData.durationTime,
        concertTag: formData.concertTag,
        adminId: formData.adminId,
        concertHallId: formData.concertHallId,
        images: formData.images,
      };

      // 실제 API 호출로 변경 필요
      console.log('🚀 콘서트 생성 데이터:', concertData);

      // 임시: createVenue 대신 실제 콘서트 생성 API 호출
      // const newConcert = await createConcert(concertData);

      console.log('✅ 콘서트 생성 성공');
      router.push('/admin/concerts');
    } catch (error) {
      console.error('❌ 콘서트 생성 실패:', error);
      alert('콘서트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getThumbnailImage = () => {
    return formData.images.find((img) => img.imagesRole === 'THUMBNAIL');
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
                {formData.concertRounds.length > 0 && formData.concertRounds[0].date && (
                  <span className={styles.previewStat}>
                    🎭 {new Date(formData.concertRounds[0].date).toLocaleDateString()} 첫
                    공연
                  </span>
                )}
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

              {/* 주소 입력 부분 - 수정된 부분 */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  주소 <span className={styles.required}>*</span>
                </label>

                {/* 기본 주소 검색 버튼 */}
                <div className={styles.addressInputGroup}>
                  <input
                    type='text'
                    value={baseAddress}
                    onClick={() => {
                      console.log('주소 검색 버튼 클릭됨');
                      setShowPostcodeModal(true);
                    }}
                    placeholder='클릭하여 주소 검색'
                    className={`${styles.input} ${styles.clickableInput} ${errors.location ? styles.inputError : ''}`}
                    readOnly
                  />
                </div>

                {/* 상세 주소 입력 */}
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

          {/* 콘서트 회차 정보 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>콘서트 회차</h3>

            <div className={styles.formGroup}>
              <div className={styles.roundsContainer}>
                {formData.concertRounds.map((round, index) => (
                  <div key={round.id} className={styles.roundItem}>
                    <div className={styles.roundHeader}>
                      <span className={styles.roundNumber}>{index + 1}회차</span>
                      {formData.concertRounds.length > 1 && (
                        <button
                          type='button'
                          onClick={() => removeConcertRound(round.id)}
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
                          onChange={(e) =>
                            updateConcertRound(round.id, 'date', e.target.value)
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
                            updateConcertRound(round.id, 'startTime', e.target.value)
                          }
                          className={styles.input}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type='button'
                  onClick={addConcertRound}
                  className={styles.addRoundButton}
                >
                  + 회차 추가
                </button>

                {errors.concertRounds && (
                  <span className={styles.errorMessage}>{errors.concertRounds}</span>
                )}

                <div className={styles.inputHint}>
                  각 회차별로 공연 날짜와 시작 시간을 설정하세요
                </div>
              </div>
            </div>
          </div>

          {/* 예매 일정 정보 */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>예매 일정</h3>
            <div className={styles.formGrid}>
              {/* 예매 시작일시 */}
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

              {/* 예매 종료일시 */}
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
              {/* 가격 */}
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

              {/* 공연 시간 */}
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
              {/* 연령 제한 */}
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

            {/* 썸네일 이미지 */}
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

            {/* 상세 이미지 업로드 */}
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

            {/* 추가 이미지들 표시 */}
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

          {/* 제출 버튼 */}
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
