import ApiTest from '@/components/admin/apiTest';
import { withAdminLayout } from '@/utils/withAdminLayout';
import type { NextPageWithLayout } from '@/types/layout';

const AdminTestPage: NextPageWithLayout = () => {
  return <ApiTest />;
};

AdminTestPage.getLayout = withAdminLayout({ title: 'API 테스트' });

export default AdminTestPage;
// 이 페이지는 관리자 API 테스트용으로, 실제 운영 환경에서는 사용하지 않습니다.
