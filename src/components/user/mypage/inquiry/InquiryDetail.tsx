// components/user/mypage/inquiry/InquiryDetail.tsx
import React, { useEffect, useState } from 'react';
import styles from './inquiryDetail.module.css';
import MypageNav from '@/components/user/mypage/MypageNav';

interface InquiryDetailProps {
  id: string;
}

interface InquiryData {
  title: string;
  content: string;
  answer: string | null;
  createdAt: string;
  repliedAt: string | null;
  imagePaths?: string[]; // 이미지 경로 추가
}

// 인증된 이미지 컴포넌트
const AuthenticatedImage = ({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      console.log('🔍 이미지 로딩 시작:', src);

      try {
        const token = localStorage.getItem('accessToken');
        console.log('🔑 토큰 확인:', token ? '토큰 존재' : '토큰 없음');
        console.log('토큰 ', token);
        if (!token) {
          console.error('❌ 토큰이 없어 이미지 로딩 실패');
          setImageError(true);
          return;
        }

        console.log('📡 이미지 요청 시작 - URL:', src);
        const response = await fetch(src, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log('📥 응답 상태:', response.status, response.statusText);
        console.log('📋 응답 헤더:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          console.error('❌ 응답 실패:', response.status, response.statusText);
          throw new Error(`이미지 로드 실패: ${response.status} ${response.statusText}`);
        }

        console.log('💾 Blob 변환 시작...');
        const blob = await response.blob();
        console.log('💾 Blob 정보:', {
          size: blob.size,
          type: blob.type,
        });

        console.log('🔗 Object URL 생성 중...');
        const objectUrl = URL.createObjectURL(blob);
        console.log('✅ Object URL 생성 완료:', objectUrl);

        setImageSrc(objectUrl);
        console.log('🎉 이미지 로딩 성공!');
      } catch (err) {
        console.error('💥 이미지 로딩 오류:', err);
        console.error('📊 오류 상세:', {
          message: err instanceof Error ? err.message : '알 수 없는 오류',
          stack: err instanceof Error ? err.stack : undefined,
        });
        setImageError(true);
      }
    };

    if (src) {
      console.log('🚀 이미지 컴포넌트 마운트 - src:', src);
      fetchImage();
    } else {
      console.warn('⚠️ src가 없음');
    }

    // cleanup: Object URL 메모리 해제
    return () => {
      if (imageSrc) {
        console.log('🧹 Object URL 해제:', imageSrc);
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src]);

  if (imageError) {
    return <div className={`${styles.imageError} ${className}`}>이미지 로드 실패</div>;
  }

  if (!imageSrc) {
    return <div className={`${styles.imageLoading} ${className}`}>로딩 중...</div>;
  }

  return <img src={imageSrc} alt={alt} className={className} />;
};

export default function InquiryDetail({ id }: InquiryDetailProps) {
  const [inquiry, setInquiry] = useState<InquiryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError('로그인이 필요합니다.');
          return;
        }

        const res = await fetch(`http://localhost:8080/api/inquiries/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: '*/*',
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || '문의 상세 조회 실패');
        }

        const data = await res.json();

        // 이미지 경로를 절대 URL로 변환
        // 이미지 경로를 절대 URL로 변환
        const processedData = {
          ...data,
          imagePaths: data.imagePaths?.map(
            (path: string) => `http://localhost:8080${path}`,
          ),
        };

        setInquiry(processedData);
      } catch (error) {
        console.error('문의 상세 조회 오류:', error);
        setError(error instanceof Error ? error.message : '문의를 불러오는 중 오류 발생');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div className={styles.loading}>로딩 중...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!inquiry) return <div className={styles.error}>문의 정보를 찾을 수 없습니다.</div>;

  return (
    <div className={styles.all}>
      <div className={styles.margin}>
        <h1 className={styles.title}>마이페이지</h1>
        <div className={styles.container}>
          <MypageNav />
          <section className={styles.content}>
            <div className={styles.inquiryContent}>
              <div className={styles.inquiryTitle}>{inquiry.title}</div>

              <div className={styles.chating}>
                <div className={styles.chatBox}>
                  {/* 오른쪽: 질문 */}
                  <div className={`${styles.messageWrapper} ${styles.right}`}>
                    <div className={styles.messageRow}>
                      <span className={styles.date}>
                        {new Date(inquiry.createdAt).toLocaleDateString()}
                      </span>
                      <div className={styles.answer}>
                        <p>제목 : {inquiry.title}</p>
                        <p>내용 : {inquiry.content}</p>

                        {/* 질문 이미지들 */}
                        {inquiry.imagePaths && inquiry.imagePaths.length > 0 && (
                          <div className={styles.imagePreviewContainer}>
                            {inquiry.imagePaths.map((imagePath, idx) => (
                              <AuthenticatedImage
                                key={idx}
                                src={imagePath}
                                alt={`문의 이미지 ${idx + 1}`}
                                className={styles.inquiryImage}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 왼쪽: 답변 */}
                  {inquiry.answer && (
                    <div className={`${styles.messageWrapper} ${styles.left}`}>
                      <div className={styles.messageRow}>
                        <div className={styles.question}>
                          <p>{inquiry.answer}</p>
                        </div>
                        <span className={styles.date}>
                          {new Date(inquiry.repliedAt || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
