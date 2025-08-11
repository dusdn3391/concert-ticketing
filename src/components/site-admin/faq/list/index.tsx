import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/site-admin/common/Header';
import Nav from '@/components/site-admin/common/Nav';
import pageStyles from './Admin.module.css';

interface Faq {
  id: number;
  question: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  createdAt: string;
}

const FaqListPage = () => {
  const [faqs, setFaqs] = useState<Faq[]>([]);
const faqTabs = ['전체', '상품', '배송', '취소', '결제/환불', '기타'];



  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/faqs', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_FAQ_ADMIN_TOKEN}`, // 토큰을 환경변수로 처리 (보안상 권장)
            'Accept': '*/*',
          },
        });

        if (!response.ok) {
          throw new Error('FAQ 데이터를 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        setFaqs(data); // 배열 형태라고 가정함
        console.log('FAQ 목록:', data);
      } catch (error) {
        console.error('FAQ 가져오기 실패:', error);
      }
    };

    fetchFaqs();
  }, []);

  return (
    <div className={pageStyles.wrapper}>
      <Header />
      <div className={pageStyles.body}>
        <Nav />
        <main className={pageStyles.content}>
          <div className={pageStyles.pageHeader}>
            <h2>FAQ 관리</h2>
            <Link href='/site-admin/faq/write' className={pageStyles.createBtn}>
              + FAQ 등록
            </Link>
          </div>

          <table className={pageStyles.table}>
            <thead>
              <tr>
                <th>제목</th>
                <th>상태</th>
                {/* <th>등록일</th> */}
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {faqs.length > 0 ? (
                faqs.map((faq) => (
                  <tr key={faq.id}>
                    <td>{faq.question}</td>
                    <td>{faq.visibility === 'PUBLIC' ? '노출' : '비노출'}</td>
                    {/* <td>{faq.createdAt.slice(0, 10)}</td> */}
                    <td>
                      <Link
                        href={{
                          pathname: `/site-admin/faq/${faq.id}`,
                          query: {
                            title: faq.question,
                            status: faq.visibility,
                          },
                        }}
                        className={pageStyles.editBtn}
                        onClick={() => console.log(`faq ${faq.id} 수정 요청`)}
                      >
                        수정
                      </Link>
                      <button
                        className={pageStyles.deleteBtn}
                        onClick={() => console.log(`faq ${faq.id} 삭제 요청`)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>FAQ가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </main>
      </div>
    </div>
  );
};

export default FaqListPage;
