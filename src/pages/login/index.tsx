import LoginForm from '@/components/user/login/LoginForm';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = (isFirstSignup: boolean) => {
    if (isFirstSignup) {
      // 첫 회원가입이면 회원가입 페이지로 이동하거나 처리
      router.push('/signup');
    } else {
      // 기존 회원이면 메인 페이지로 이동
      router.push('/');
    }
  };

  return <LoginForm onLoginSuccess={handleLoginSuccess} />;
}
