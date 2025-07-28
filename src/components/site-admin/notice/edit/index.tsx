// /pages/site-admin/banner/[id].tsx
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Header from '@/components/site-admin/common/Header';
import Nav from '@/components/site-admin/common/Nav';
import NoticeForm from '@/components/site-admin/notice/NoticeForm';
import styles from './NoticeEdit.module.css';

type Props = {
  id: number;
  title: string;
  status: string;
  description?: string;
};

const NoticeEditPage = ({ id, title, status, description }: Props) => {
  const router = useRouter();

  const initialData = {
    title,
    status,
    description: description ?? '',
  };

  const handleSubmit = (form: any) => {
    console.log('배너 수정 완료:', { id, ...form });
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
          <NoticeForm mode='edit' initialData={initialData} onSubmit={handleSubmit} />
        </main>
      </div>
    </div>
  );
};

export default NoticeEditPage;
