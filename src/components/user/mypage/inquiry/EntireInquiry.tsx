import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';

import Pagination from '@/components/user/common/Pagination';
import MypageNav from '@/components/user/mypage/MypageNav';
import styles from './Inquiry.module.css';

export default function EntireInquiry() {
  const router = useRouter();
  const inquiriesPerPage = 5;
  const inquiryData = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    title: `예약판매 기간 ${i + 1}`,
    state: `답변완료`,
    content: `이것은 ${i + 1}번째 1:1문의 입니다.`,
    date: `2025-05-${String((i % 31) + 1).padStart(2, '0')}`,
  }));

  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLast = currentPage * inquiriesPerPage;
  const indexOfFirst = indexOfLast - inquiriesPerPage;
  const currentInquiries = inquiryData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(inquiryData.length / inquiriesPerPage);

  return (
    <div className={styles.all}>
      <div className={styles.margin}>
        <h1 className={styles.title}>마이페이지</h1>
        <div className={styles.container}>
          <MypageNav />
          <section className={styles.content}>
            <div className={styles.inquiryContent}>
              <div className={styles.inquiryTitle}>1:1 문의내역</div>
              <div className={styles.inquirys}>
                {currentInquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className={styles.inquiry}
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/mypage/inquiry/${inquiry.id}`)}
                  >
                    <p>{inquiry.title}</p>
                    <div className={styles.inquiryState}>
                      <p>{inquiry.state}</p>
                      <div className={styles.line} />
                      <p>{inquiry.date}</p>
                      <Image
                        src='/Group 687rightarrow.png'
                        alt='이전'
                        width={12}
                        height={12}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
