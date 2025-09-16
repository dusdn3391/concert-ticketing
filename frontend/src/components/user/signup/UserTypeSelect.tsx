import React from 'react';
import { useRouter } from 'next/router';
import { useUserTypeStore } from '@/stores/userTypeStore';

type Props = {
  onSelect: (role: 'user' | 'admin') => void;
};

export default function UserTypeSelect({ onSelect }: Props) {
  const setUserType = useUserTypeStore((state) => state.setUserType);
  const router = useRouter();

  const handleSelect = (type: 'user' | 'admin') => {
    setUserType(type);
    onSelect(type);

    if (type === 'admin') {
      router.push('/admin/signup');
    }
  };

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>회원 유형을 선택해주세요</h2>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        <button onClick={() => handleSelect('user')}>사용자</button>
        <button onClick={() => handleSelect('admin')}>콘서트 관리자</button>
      </div>
    </div>
  );
}
