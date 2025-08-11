import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/site-admin/common/Header';
import Nav from '@/components/site-admin/common/Nav';
import styles from './InquiryDetail.module.css';

interface InquiryItem {
  id: number;
  type: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  answer?: string;
  answeredAt?: string;
  userEmail:string;
  files?: string[];
  notificationEmail?: string;
  phoneNumber?: string;
}

const InquiryAnswerPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [inquiry, setInquiry] = useState<InquiryItem | null>(null);
  const [answerContent, setAnswerContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const token = localStorage.getItem('admin_token');
        const res = await fetch(`http://localhost:8080/api/admin/inquiries/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: '*/*',
          },
        });

        if (!res.ok) throw new Error('❌ 문의 상세 조회 실패');
        const data = await res.json();
        setInquiry(data);
        setAnswerContent(data.answer || '');
        setIsLoading(false);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [id]);

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return '답변완료';
    case 'PENDING':
      return '답변대기';
    default:
      return status;
  }
};

  const handleSubmitAnswer = async () => {
    if (!inquiry || !answerContent.trim()) return;
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(
        `http://localhost:8080/api/admin/inquiries/${inquiry.id}/answer`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: '*/*',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ answer: answerContent }),
        },
      );

      if (!res.ok) throw new Error('답변 저장 실패');

      const today = new Date().toISOString();
      setInquiry({
        ...inquiry,
        answer: answerContent,
        status: 'COMPLETED',
      });

      alert('답변이 성공적으로 저장되었습니다.');
      router.push('/site-admin/inquiry');
    } catch (error) {
      console.error(error);
      alert('답변 저장 중 오류가 발생했습니다.');
    }
  };

  const handleCancel = () => {
    if (answerContent !== (inquiry?.answer || '')) {
      if (confirm('작성 중인 답변이 있습니다. 정말 취소하시겠습니까?')) {
        router.push('/site-admin/inquiry');
      }
    } else {
      router.push('/site-admin/inquiry');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.wrapper}>
        <Header />
        <div className={styles.body}>
          <Nav />
          <div className={styles.content}>
            <div className={styles.loading}>로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className={styles.wrapper}>
        <Header />
        <div className={styles.body}>
          <Nav />
          <div className={styles.content}>
            <div className={styles.error}>문의를 찾을 수 없습니다.</div>
          </div>
        </div>
      </div>
    );
  }
  return (
      <div className={styles.wrapper}>
          <Header />
        <div className={styles.body}>
        <Nav />
          <div className={styles.content}>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>
                {inquiry.status === '답변완료' ? '답변 수정' : '답변 작성'}
              </h1>
              <div className={styles.breadcrumb}>
                <span onClick={() => router.push('/contact/inquiry')} className={styles.breadcrumbLink}>
                  문의 목록
                </span>
                <span className={styles.breadcrumbSeparator}>></span>
                <span>답변 {inquiry.status === '답변완료' ? '수정' : '작성'}</span>
              </div>
            </div>

            {/* 원본 문의 정보 */}
            <div className={styles.inquirySection}>
              <h2 className={styles.sectionTitle}>원본 문의</h2>
              <div className={styles.inquiryCard}>
                <div className={styles.inquiryHeader}>
                  <div className={styles.inquiryMeta}>
                    <span className={styles.category}>{inquiry.type}</span>
                   <span className={`${styles.status} ${styles[inquiry.status]}`}>
                     {getStatusLabel(inquiry.status)}
                   </span>
                     <span className={styles.date}>작성일: {inquiry.createdAt.split('T')[0]}</span>
                  </div>
                </div>
                
                <div className={styles.inquiryContent}>
                  <h3 className={styles.inquiryTitle}>{inquiry.title}</h3>
                  <p className={styles.inquiryText}>{inquiry.content}</p>
                </div>

                {/* 연락처 정보 */}
                <div className={styles.contactInfo}>
                  <h4>연락처 정보</h4>
                  {inquiry.userEmail && (
                    <p><strong>알림 이메일:</strong> {inquiry.userEmail}</p>
                  )}
                 
                </div>
              </div>
            </div>

            {/* 답변 작성 섹션 */}
            <div className={styles.answerSection}>
              <h2 className={styles.sectionTitle}>답변 작성</h2>
              <div className={styles.answerForm}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>답변 내용</label>
                  <textarea
                    className={styles.answerTextarea}
                    value={answerContent}
                    onChange={(e) => setAnswerContent(e.target.value)}
                    placeholder="고객에게 도움이 되는 정확하고 친절한 답변을 작성해주세요..."
                    rows={12}
                  />
                  <div className={styles.textareaInfo}>
                    <span className={styles.charCount}>
                      {answerContent.length} / 2000자
                    </span>
                  </div>
                </div>

                {/* 답변 작성 가이드 */}
                <div className={styles.answerGuide}>
                  <h4>답변 작성 가이드</h4>
                  <ul>
                    <li>고객의 문의사항에 정확하고 구체적으로 답변해주세요.</li>
                    <li>친절하고 정중한 톤으로 작성해주세요.</li>
                    <li>필요한 경우 추가 연락처나 참고 링크를 제공해주세요.</li>
                    <li>답변 완료 후 고객에게 이메일/SMS로 알림이 발송됩니다.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 기존 답변 (수정 모드일 때) */}
            {inquiry.status === '답변완료' && inquiry.answer && (
              <div className={styles.previousAnswerSection}>
                <h2 className={styles.sectionTitle}>기존 답변</h2>
                <div className={styles.previousAnswerCard}>
                  <p className={styles.previousAnswerText}>{inquiry.answer}</p>
                  <p className={styles.previousAnswerDate}>답변일: {inquiry.answeredAt}</p>
                </div>
              </div>
            )}

            {/* 버튼 그룹 */}
            <div className={styles.buttonGroup}>
              <button 
                className={styles.cancelButton}
                onClick={handleCancel}
              >
                취소
              </button>
              <button 
                className={styles.submitButton}
                onClick={handleSubmitAnswer}
                disabled={!answerContent.trim()}
              >
                {inquiry.status === '답변완료' ? '답변 수정' : '답변 저장'}
              </button>
            </div>
          </div>
        </div>
    </div>
  );
};

export default InquiryAnswerPage;