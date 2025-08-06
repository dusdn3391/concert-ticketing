import { GetServerSideProps } from 'next';
import BannerEditPage from '@/components/site-admin/banner/edit/BannerEdit';

type Props = {
  id: string;
};

export default function Page({ id }: Props) {
  return <BannerEditPage id={id} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params ?? {};

  if (!id || Array.isArray(id) || !/^\d+$/.test(id as string)) {
    return {
      redirect: {
        destination: '/site-admin/banner',
        permanent: false,
      },
    };
  }

  return {
    props: {
      id,
    },
  };
};
