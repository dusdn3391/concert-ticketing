import React from 'react';
import { useRouter } from 'next/router';

import CustomerSidebar from '@/components/user/contact/ContactNav';
import styles from './Delivery.module.css';

const categoryLabels: Record<string, string> = {
  delivery: '배송',
  product: '상품',
  cancel: '취소',
  payment: '결제/환불',
  etc: '기타',
};

const faqDataByCategory: Record<
  string,
  { id: string; question: string; answer: string }[]
> = {
  delivery: [
    { id: 'd1', question: '배송은 얼마나 걸리나요?', answer: '보통 2~3일 걸립니다.' },
    {
      id: 'd2',
      question: '배송조회는 어디서 하나요?',
      answer: '마이페이지에서 확인 가능합니다.',
    },
  ],
  product: [
    {
      id: 'p1',
      question: '상품 교환은 어떻게 하나요?',
      answer: '고객센터에 문의해주세요.',
    },
    {
      id: 'p2',
      question: '상품 품절 시 알림을 받을 수 있나요?',
      answer: '네, 알림 신청이 가능합니다.',
    },
  ],
  cancel: [
    {
      id: 'c1',
      question: '주문 취소는 어떻게 하나요?',
      answer: '주문 후 30분 이내 취소 가능합니다.',
    },
  ],
  payment: [
    {
      id: 'pay1',
      question: '결제 수단은 어떤 것이 있나요?',
      answer: '카드, 계좌이체, 휴대폰 결제가 가능합니다.',
    },
  ],
  etc: [
    {
      id: 'e1',
      question: '기타 문의는 어떻게 하나요?',
      answer: '1:1 문의하기를 이용해주세요.',
    },
  ],
};

const FAQCategoryPage = () => {
  const router = useRouter();

  if (!router.isReady) return null;

  const { category } = router.query;
  const categoryKey = Array.isArray(category) ? category[0] : category || '';
  const categoryLabel = categoryLabels[categoryKey] || 'FAQ';

  const faqList = faqDataByCategory[categoryKey] || [];

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>고객센터</h1>
        <div className={styles.layout}>
          <CustomerSidebar activeMenu={categoryKey} />
          <div className={styles.mainContent}>
            <div className={styles.topTitle}>
              <h2 className={styles.pageTitle}>FAQ</h2>
              <div className={styles.searchBox}>
                <input
                  type='text'
                  placeholder='검색어를 입력하세요'
                  className={styles.searchInput}
                />
                <button className={styles.searchButton}>
                  <img src='/search.png' alt='검색' />
                </button>
              </div>
            </div>

            <div className={styles.form}>
              <h3 className={styles.category}>{categoryLabel}</h3>

              <div className={styles.accordion}>
                {faqList.length === 0 && <p>해당 카테고리의 FAQ가 없습니다.</p>}
                {faqList.map((item) => (
                  <div key={item.id} className={styles.item}>
                    <details>
                      <summary className={styles.question}>{item.question}</summary>
                      <div className={styles.answer}>{item.answer}</div>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQCategoryPage;
