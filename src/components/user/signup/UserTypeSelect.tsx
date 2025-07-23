import React from 'react';

type Props = {
  onSelect: (role: 'user' | 'admin') => void;
};

export default function UserTypeSelect({ onSelect }: Props) {
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
        <button onClick={() => onSelect('user')}>사용자</button>
        <button onClick={() => onSelect('admin')}>콘서트 관리자</button>
      </div>
    </div>
  );
}
