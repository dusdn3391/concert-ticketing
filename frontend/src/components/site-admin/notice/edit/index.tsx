// /pages/site-admin/banner/[id].tsx
import { useRouter } from 'next/router';
import Header from '@/components/site-admin/common/Header';
import Nav from '@/components/site-admin/common/Nav';
import NoticeForm from '@/components/site-admin/notice/NoticeForm';
import styles from './NoticeEdit.module.css';

type Props = {
  id: number;
};

const NoticeEditPage = ({ id }: Props) => {
  const router = useRouter();

  const handleSubmit = (form: any) => {
    console.log('배너 수정 완료:', { id, ...form }); // ✅ id 포함 확인
    alert('배너가 수정되었습니다.');
    router.push('/site-admin/banner');
  };

  return (
    <div className={styles.wrapper}>
      <Header />
      <div className={styles.body}>
        <Nav />
        <main className={styles.content}>
          <h2>공지사항 수정</h2>
<NoticeForm mode="edit" onSubmit={handleSubmit} initialData={{ id }} />
        </main>
      </div>
    </div>
  );
};

export async function getServerSideProps(context: any) {
  const { id } = context.params;

  return {
    props: {
      id: Number(id),
    },
  };
}

export default NoticeEditPage;
