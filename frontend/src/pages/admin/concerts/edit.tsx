import { withAdminLayout } from '@/utils/withAdminLayout';
import type { NextPageWithLayout } from '@/types/layout';

import ConcertCreate from '@/components/admin/concerts/ConcertEdit/ConcertEdit';

const ConcertEditPage: NextPageWithLayout = () => {
  return <ConcertCreate />;
};

ConcertEditPage.getLayout = withAdminLayout({ title: '콘서트 수정' });

export default ConcertEditPage;
