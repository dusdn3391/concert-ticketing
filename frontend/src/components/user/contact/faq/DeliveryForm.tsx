import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerSidebar from '@/components/user/contact/ContactNav';
import styles from './Delivery.module.css';

const categoryLabels: Record<string, string> = {
  delivery: '배송',
  product: '상품',
  cancellation: '취소',
  payment: '결제/환불',
  etc: '기타',
};

type FAQItem = {
  id: number;
  category: string;
  visibility: string;
  question: string;
  answer: string;
};

const FAQCategoryPage = () => {
  const router = useRouter();
  const [faqDataByCategory, setFaqDataByCategory] = useState<Record<string, FAQItem[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);

  if (!router.isReady) return null;

  const { category } = router.query;
  const categoryKey = Array.isArray(category) ? category[0] : category || '';
  const categoryLabel = categoryLabels[categoryKey] || 'FAQ';
  const faqList = faqDataByCategory[categoryKey] || [];

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL}/api/faqs`,
          {
            headers: {
              Accept: '*/*',
            },
          },
        );

        if (!res.ok) throw new Error('FAQ 데이터를 불러오는데 실패했습니다.');

        const data: FAQItem[] = await res.json();

        // 카테고리별로 데이터 분류 (대문자 -> 소문자 변환)
        const grouped: Record<string, FAQItem[]> = {};
        data.forEach((item) => {
          const key = item.category.toLowerCase(); // "PRODUCT" -> "product"
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(item);
        });

        setFaqDataByCategory(grouped);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  if (loading) {
    return <p>FAQ를 불러오는 중입니다...</p>;
  }

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
