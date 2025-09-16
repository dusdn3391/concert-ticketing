import { useState, useEffect } from 'react';
import styles from './FaqForm.module.css';

type CategoryCode = 'PRODUCT' | 'DELIVERY' | 'CANCELLATION' | 'PAYMENT' | 'ETC';

const CATEGORY_LABELS: Record<CategoryCode, string> = {
  PRODUCT: '상품',
  DELIVERY: '배송',
  CANCELLATION: '취소',
  PAYMENT: '결제/환불',
  ETC: '기타',
};

type FaqFormProps = {
  id?: number;
  mode: 'edit' | 'create';
  onSubmit: (form: any) => void;
};

export default function FaqForm({ id, mode }: FaqFormProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [category, setCategory] = useState<CategoryCode>('PRODUCT');

  useEffect(() => {
    if (mode === 'edit' && id) {
      fetch(`/api/faqs/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setQuestion(data.question);
          setAnswer(data.answer);
          setVisibility(data.visibility);
          setCategory(data.category);
        })
        .catch((err) => {
          console.error('FAQ 불러오기 실패:', err);
        });
    }
  }, [id, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      category,
      visibility,
      question,
      answer,
    };

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL;
      const url =
        mode === 'create' ? `${baseUrl}/api/faqs/create` : `${baseUrl}/api/faqs/${id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const token = localStorage.getItem('admin_token');

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`FAQ ${mode === 'create' ? '등록' : '수정'} 실패`);

      alert(`FAQ가 ${mode === 'create' ? '등록' : '수정'}되었습니다.`);
      window.location.href = '/site-admin/faq';
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label htmlFor='category'>카테고리</label>
      <select
        id='category'
        value={category}
        onChange={(e) => setCategory(e.target.value as CategoryCode)}
      >
        {Object.entries(CATEGORY_LABELS).map(([code, label]) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>

      <label htmlFor='question'>질문</label>
      <input
        id='question'
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder='FAQ 질문을 입력하세요'
        required
      />

      <label htmlFor='answer'>답변</label>
      <textarea
        id='answer'
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder='FAQ 답변을 입력하세요'
        rows={4}
      />

      <label htmlFor='visibility'>노출 상태</label>
      <select
        id='visibility'
        value={visibility}
        onChange={(e) => setVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')}
      >
        <option value='VISIBLE'>노출</option>
        <option value='HIDDEN'>비노출</option>
      </select>

      <div className={styles.buttonGroup}>
        <button type='submit'>{mode === 'edit' ? '수정' : '등록'}</button>
      </div>
    </form>
  );
}
