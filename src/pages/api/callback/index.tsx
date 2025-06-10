// pages/auth/callback.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    const { code, state } = router.query;

    if (code) {
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log('로그인 성공:', data);
          router.push('/');
        })
        .catch((err) => {
          console.error('로그인 실패:', err);
        });
    }
  }, [router.query]);

  return <p>로그인 처리 중...</p>;
}
