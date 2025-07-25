// components/site-admin/banner/edit/BannerEditPage.tsx
import Header from '@/components/site-admin/common/Header';
import Nav from '@/components/site-admin/common/Nav';
import BannerForm from '@/components/site-admin/banner/BannerForm';
import styles from './BannerEdit.module.css';

type Props = {
  id: string;
  title: string;
  description?: string;
  status: '노출' | '비노출';
};

const BannerEditPage = ({ id, title, status, description }: Props) => {
  const initialData = {
    title,
    description: description ?? '',
    status,
  };

  console.log('배너 정보 ', { id, status, title });
  const handleSubmit = (form: any) => {
    console.log('배너 수정 완료:', { id, ...form });
    alert('배너가 수정되었습니다.');
  };

  return (
    <div className={styles.wrapper}>
      <Header />
      <div className={styles.body}>
        <Nav />
        <main className={styles.content}>
          <h2>배너 수정</h2>
          <BannerForm
            mode='edit'
            initialData={initialData}
            id={id}
            onSubmit={handleSubmit}
          />
        </main>
      </div>
    </div>
  );
};

export default BannerEditPage;
