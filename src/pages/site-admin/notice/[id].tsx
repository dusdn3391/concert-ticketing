// pages/site-admin/notice/[id].tsx

import { GetServerSideProps } from 'next';
import ManagerNoticeEdit from '@/components/site-admin/notice/edit/index';

type Props = {
  id: number;
};

export default function ManagerNoticeEditPage({ id }: Props) {
  return <ManagerNoticeEdit id={id} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params ?? {};

  if (!id || Array.isArray(id) || !/^\d+$/.test(id as string)) {
    return {
      redirect: {
        destination: '/site-admin/notice',
        permanent: false,
      },
    };
  }

  return {
    props: {
      id: parseInt(id as string, 10),
    },
  };
};
