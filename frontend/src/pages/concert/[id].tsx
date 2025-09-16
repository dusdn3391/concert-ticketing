import { GetServerSideProps } from 'next';

import ConcertDetail from '@/components/user/concert/detail/ConcertDetail';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params ?? {};

  if (!id || Array.isArray(id) || !/^\d+$/.test(id as string)) {
    return {
      redirect: {
        destination: '/concert',
        permanent: false,
      },
    };
  }

  return {
    props: { id },
  };
};

export default function ConcertDetailPage({ id }: { id: string }) {
  return <ConcertDetail id={id} />;
}
