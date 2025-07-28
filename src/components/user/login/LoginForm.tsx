import React from 'react';
import Image from 'next/image';
import styles from './LoginForm.module.css';

const REDIRECT_URI = 'http://localhost:3000/oauth/success';

const CLIENT_IDS = {
  kakao: process.env.NEXT_PUBLIC_KAKAO_KEY as string,
  naver: process.env.NEXT_PUBLIC_NAVER_KEY as string,
  google: process.env.NEXT_PUBLIC_GOOGLE_KEY as string,
};

type Provider = 'kakao' | 'naver' | 'google';

interface LoginFormProps {
  onLoginSuccess?: (isFirstSignup: boolean) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const handleLogin = (provider: Provider): void => {
    let url = '';

    if (provider === 'kakao') {
      url = `https://kauth.kakao.com/oauth/authorize?client_id=${CLIENT_IDS.kakao}&redirect_uri=${REDIRECT_URI}&response_type=code&state=${provider}`;
    } else if (provider === 'naver') {
      const state = `${provider}_${crypto.randomUUID()}`;
      localStorage.setItem('oauth_state', state);
      url = `https://nid.naver.com/oauth2.0/authorize?client_id=${CLIENT_IDS.naver}&redirect_uri=${REDIRECT_URI}&state=${state}&response_type=code`;
    } else if (provider === 'google') {
      url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_IDS.google}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=profile email&state=${provider}`;
    }

    window.location.href = url;
  };

  return (
    <div className={styles.all}>
      <div className={styles.center}>
        <h1>concert-ticketing</h1>
        <div className={styles.socialButtons}>
          <button
            onClick={() => handleLogin('kakao')}
            className={styles.kakaoButton}
            aria-label='카카오 로그인'
          >
            <img src='/login/kakao_login_medium_wide.png' alt='카카오 로그인' />
          </button>

          <button
            className={styles.naver}
            onClick={() => handleLogin('naver')}
            aria-label='네이버 로그인'
          >
            <div className={styles.iconWrapper}>
              <Image
                src='/login/btnG_아이콘원형.png'
                alt='Naver'
                width={40}
                height={40}
              />
            </div>
            <span className={styles.naverText}>Naver로 시작하기</span>
          </button>

          <button
            className={styles['gsi-material-button']}
            onClick={() => handleLogin('google')}
            aria-label='구글 로그인'
          >
            <div className={styles['gsi-material-button-state']} />
            <div className={styles['gsi-material-button-content-wrapper']}>
              <div className={styles['gsi-material-button-icon']}>
                <svg version='1.1' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'>
                  <path
                    fill='#EA4335'
                    d='M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0C14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'
                  />
                  <path
                    fill='#4285F4'
                    d='M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.45 38.37 47.03 32.19 47.03 24.55z'
                  />
                  <path
                    fill='#FBBC05'
                    d='M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'
                  />
                  <path
                    fill='#34A853'
                    d='M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3c-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'
                  />
                  <path fill='none' d='M0 0h48v48H0z' />
                </svg>
              </div>
              <span className={styles['gsi-material-button-contents']}>
                Google로 시작하기
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
