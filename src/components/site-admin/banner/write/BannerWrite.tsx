// /pages/site-admin/banner/write.tsx
import { useRouter } from 'next/router';
import Header from '@/components/site-admin/common/Header';
import Nav from '@/components/site-admin/common/Nav';
import BannerForm from '@/components/site-admin/banner/BannerForm';
import styles from './Write.module.css';

const BannerWritePage = () => {
  const router = useRouter();

  const handleSubmit = (form: any) => {
    console.log('배너 등록:', form);
    alert('배너가 등록되었습니다.');
    router.push('/site-admin/banner');
  };

  return (
    <div className={styles.wrapper}>
      <Header />
      <div className={styles.body}>
        <Nav />
        <main className={styles.content}>
          <h2>배너 등록</h2>
          <BannerForm mode='create' onSubmit={handleSubmit} />
        </main>
      </div>
    </div>
  );
};

export default BannerWritePage;
