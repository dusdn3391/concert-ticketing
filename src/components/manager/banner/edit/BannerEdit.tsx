// /pages/manager/banner/[id].tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '@/components/manager/common/Header';
import Nav from '@/components/manager/common/Nav';
import BannerForm from '@/components/manager/banner/BannerForm';
import styles from './BannerEdit.module.css';

const BannerEditPage = () => {
  const router = useRouter();
  const { id, title, status, description } = router.query;

  const [initialData, setInitialData] = useState<{
    title: string;
    description: string;
    status: '노출' | '비노출';
    imageUrl?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof title === 'string' && typeof status === 'string') {
      setInitialData({
        title,
        description: typeof description === 'string' ? description : '',
        status: status as '노출' | '비노출',
      });

      console.log('[EditPage] query로 받은 값:', { id, title, status, description });
    }
  }, [id, title, status, description]);

  const handleSubmit = (form: any) => {
    console.log('배너 수정 완료:', { id, ...form });
    alert('배너가 수정되었습니다.');
    router.push('/manager/banner');
  };

  if (!initialData) return null;

  return (
    <div className={styles.wrapper}>
      <Header />
      <div className={styles.body}>
        <Nav />
        <main className={styles.content}>
          <h2>배너 수정</h2>
          <BannerForm mode='edit' initialData={initialData} onSubmit={handleSubmit} />
        </main>
      </div>
    </div>
  );
};

export default BannerEditPage;
