import { useRouter } from 'next/router';
import Header from '@/components/site-admin/common/Header';
import Nav from '@/components/site-admin/common/Nav';
import FaqForm from '@/components/site-admin/faq/FaqForm';
import styles from './FaqEdit.module.css';

type Props = {
  id: string;
};

const FaqEditPage = ({ id }: Props) => {
  const router = useRouter();

  const handleSubmit = (form: any) => {
    console.log('FAQ 수정 완료:', { id, ...form }); // ✅ id 포함 확인
    alert('FAQ가 수정되었습니다.');
    router.push('/site-admin/faq');
  };

  return (
    <div className={styles.wrapper}>
      <Header />
      <div className={styles.body}>
        <Nav />
        <main className={styles.content}>
          <h2>FAQ 수정</h2>
          <FaqForm mode="edit" onSubmit={handleSubmit} initialData={{ id }} />
        </main>
      </div>
    </div>
  );
};

export async function getServerSideProps(context: any) {
  const { id } = context.params;

  return {
    props: {
      id: String(id),
    },
  };
}

export default FaqEditPage;