import { GetServerSideProps } from 'next';
import FaqEditPage from '@/components/site-admin/faq/edit/FaqEdit';

type Props = {
  id: string;
};

export default function Page(props: Props) {
  return <FaqEditPage {...props} />;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params ?? {};

  if (!id || Array.isArray(id) || !/^\d+$/.test(id)) {
    return {
      redirect: {
        destination: '/site-admin/faq',
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
