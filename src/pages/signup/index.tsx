import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import LoginForm from '@/components/user/login/LoginForm';
import UserTypeSelect from '@/components/user/signup/UserTypeSelect';
import SignupForm from '@/components/user/signup/SignupForm'; // 추가

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'select' | 'login' | 'signup'>('select'); // 'signup' 추가

  useEffect(() => {
    if (!router.isReady) return;

    const isFirst = router.query.first;

    if (isFirst === 'true') {
      console.log('소셜 로그인 성공: 최초 로그인');
      setStep('signup'); // ✅ 이제 SignupForm으로 설정
    } else if (isFirst === 'false') {
      console.log('소셜 로그인 성공: 기존 회원');
      router.replace('/login');
    }
  }, [router.isReady, router.query]);

  const handleRoleSelect = (role: 'user' | 'admin') => {
    console.log('선택된 역할:', role);
    setStep('login');
  };

  if (step === 'signup') return <SignupForm />;
  if (step === 'login') return <LoginForm />;
  return <UserTypeSelect onSelect={handleRoleSelect} />;
}
