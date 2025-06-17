import { GetServerSideProps } from 'next';

import NoticeDetailForm from '@/components/user/contact/notice/NoticeDetailForm';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params ?? {};

  if (!id || Array.isArray(id) || !/^\d+$/.test(id as string)) {
    return {
      redirect: {
        destination: '/contact/notice',
        permanent: false,
      },
    };
  }

  return {
    props: { id },
  };
};

export default function NoticeFormDetailPage({ id }: { id: string }) {
  return <NoticeDetailForm id={id} />;
}
