import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import LoginForm from '@/components/user/login/LoginForm';
import UserTypeSelect from '@/components/user/signup/UserTypeSelect';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'select' | 'login'>('select');

  useEffect(() => {
    if (!router.isReady) return;

    const isFirst = router.query.first;

    if (isFirst === 'true') {
      console.log('소셜 로그인 성공: 최초 로그인');
      setStep('login'); // LoginForm 그대로 유지
    } else if (isFirst === 'false') {
      console.log('소셜 로그인 성공: 기존 회원');
      router.replace('/login');
    }
  }, [router.isReady, router.query]);

  const handleRoleSelect = (role: 'user' | 'admin') => {
    console.log('선택된 역할:', role);
    setStep('login');
  };

  return step === 'login' ? (
    <LoginForm />
  ) : (
    <UserTypeSelect onSelect={handleRoleSelect} />
  );
}
