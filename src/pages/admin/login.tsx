import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

import { apiCall } from '@/lib/api';
import styles from '@/components/admin/login/AdminLogin.module.css';

interface LoginForm {
  admin_id: string;
  password: string;
}

export default function AdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginForm>({
    admin_id: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.admin_id || !formData.password) {
      setError('관리자 ID와 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 개발 환경에서 테스트 계정 체크
      if (formData.admin_id === 'admin' && formData.password === '1234') {
        // 테스트 계정 - 직접 로그인 처리
        const testAdmin = {
          id: 2,
          admin_id: 'admin',
          email: 'test@concert.com',
          role: 'ADMIN',
          company: '테스트컴퍼니'
        };
        const testToken = `test_token_${Date.now()}`;

        localStorage.setItem('admin_token', testToken);
        localStorage.setItem('admin_info', JSON.stringify(testAdmin));

        // 성공 메시지
        alert('테스트 계정으로 로그인 성공! 관리자 페이지로 이동합니다.');
        
        // 강제 페이지 이동
        setTimeout(() => {
          window.location.href = '/admin';
        }, 100);
        return;
      }

      // 실제 API 호출
      const data = await apiCall('/admin/login', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      // 토큰을 localStorage에 저장
      if (data.token) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_info', JSON.stringify(data.admin));
      }

      // 관리자 대시보드로 리다이렉트
      await router.push('/admin');
    } catch (err) {
      console.error('로그인 에러:', err);
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>관리자 로그인 - 콘서트 관리 시스템</title>
      </Head>

      <div className={styles.container}>
        <div className={styles.loginBox}>
          <div className={styles.header}>
            <h1 className={styles.title}>관리자 로그인</h1>
            <p className={styles.subtitle}>콘서트 관리 시스템</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor='admin_id' className={styles.label}>
                관리자 ID
              </label>
              <input
                type='text'
                id='admin_id'
                name='admin_id'
                value={formData.admin_id}
                onChange={handleInputChange}
                className={styles.input}
                placeholder='관리자 ID를 입력하세요'
                disabled={loading}
                autoComplete='username'
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor='password' className={styles.label}>
                비밀번호
              </label>
              <input
                type='password'
                id='password'
                name='password'
                value={formData.password}
                onChange={handleInputChange}
                className={styles.input}
                placeholder='비밀번호를 입력하세요'
                disabled={loading}
                autoComplete='current-password'
              />
            </div>

            {error && (
              <div className={styles.error}>
                <span className={styles.errorIcon}>❌</span>
                {error}
              </div>
            )}

            <button type='submit' className={styles.submitButton} disabled={loading}>
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <p className={styles.footerText}>콘서트 관리자만 접근 가능합니다</p>
            <div className={styles.testAccount}>
              <p className={styles.testTitle}>🧪 테스트 계정</p>
              <p className={styles.testInfo}>
                ID: <strong>admin</strong> / PW: <strong>1234</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
