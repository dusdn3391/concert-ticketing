// pages/oauth/success.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function OAuthSuccess() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const code = router.query.code as string;
    const state = router.query.state as string;

    if (code && state) {
      fetch('http://localhost:8080/oauth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      })
        .then((res) => res.text())
        .then((data) => {
          console.log('원시 응답 데이터:', data);

          try {
            const parsed = JSON.parse(data);
            console.log('파싱된 JSON:', parsed);

            if (parsed.token) {
              localStorage.setItem('accessToken', parsed.token);
              router.push('/');
            } else {
              alert('로그인 실패');
            }
          } catch (e) {
            console.error('JSON 파싱 실패:', e);
            alert('로그인 중 데이터 처리 오류 발생');
          }
        })
        .catch((err) => {
          console.error(err);
          alert('로그인 중 오류 발생');
        });
    }
  }, [router.isReady, router.query]);

  return <p>로그인 처리 중입니다...</p>;
}
