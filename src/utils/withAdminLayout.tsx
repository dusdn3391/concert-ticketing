import { ReactElement } from 'react';

import AdminLayout from '@/components/admin/common/layout/AdminLayout';
import { AuthWrapper } from '@/lib/withAuth';

interface WithAdminLayoutOptions {
  title: string;
}

export function withAdminLayout({ title }: WithAdminLayoutOptions) {
  return function getLayout(page: ReactElement): ReactElement {
    return (
      <AuthWrapper>
        <AdminLayout title={title}>{page}</AdminLayout>
      </AuthWrapper>
    );
  };
}
