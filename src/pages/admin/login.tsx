import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
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

      const response = await fetch('http://localhost:8080/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: formData.admin_id,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
      }

      const data = await response.json();

      if (data.token) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_info', JSON.stringify(data.admin));
        alert('로그인이 성공하였습니다');

        if (data.state === 'SITE_ADMIN') {
          router.push('/site-admin/banner');
        } else {
          router.push('/admin/concerts');
        }
      } else {
        throw new Error('로그인에 실패했습니다.');
      }
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
          </div>
        </div>
      </div>
    </>
  );
}
