import React, { useState } from 'react';
import { useRouter } from 'next/router';
import styles from './AdminSignupForm.module.css';
import Modal from './AdminSignupModal';
import PostcodeModal from '@/components/admin/concerts/concertCreate/PostcodeModal';

export default function AdminSignUpForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    username: '',
    password: '',
    businessName: '',
    businessNumber: '',
    businessAddress: '',
    email: '',
    phoneNumber: '',
  });

  const [errors, setErrors] = useState({
    username: '',
    password: '',
    businessName: '',
    businessNumber: '',
    businessAddress: '',
    email: '',
    phoneNumber: '',
  });

  const [showModal, setShowModal] = useState(false);
  const [showPostcode, setShowPostcode] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'username' && /[^a-zA-Z0-9]/.test(value)) return;
    if (name === 'businessNumber' && /[^0-9]/.test(value)) return;
    if (name === 'businessNumber' && value.length > 10) return;
    if (name === 'phoneNumber' && /[^0-9]/.test(value)) return;

    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{1,12}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^01[016789][0-9]{7,8}$/;

    return {
      username:
        form.username && usernameRegex.test(form.username)
          ? ''
          : '아이디는 영어와 숫자만 입력 가능합니다.',
      password:
        form.password && passwordRegex.test(form.password)
          ? ''
          : '비밀번호는 영어, 숫자, 특수문자를 포함해 12자 이하로 입력해주세요.',
      businessName: form.businessName ? '' : '사업자 명을 입력해주세요.',
      businessNumber:
        form.businessNumber.length === 10 ? '' : '사업자 번호는 10자리 숫자여야 합니다.',
      businessAddress: form.businessAddress ? '' : '사업자 소재지를 입력해주세요.',
      email:
        form.email && emailRegex.test(form.email)
          ? ''
          : '올바른 이메일 형식을 입력해주세요.',
      phoneNumber:
        form.phoneNumber && phoneRegex.test(form.phoneNumber)
          ? ''
          : '올바른 핸드폰 번호를 입력해주세요.',
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) return;

    fetch('http://localhost:8080/api/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        Accept: '*/*',
      },
      body: JSON.stringify({
        adminId: form.username,
        password: form.password,
        company: form.businessName,
        companyNumber: form.businessNumber,
        companyLocation: form.businessAddress,
        email: form.email,
        phone: form.phoneNumber,
      }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.text().then((errorText) => {
            console.error('❌ 회원가입 실패:', errorText);
            alert('회원가입에 실패했습니다.');
            throw new Error('회원가입 실패');
          });
        }
        return res.text();
      })
      .then((token) => {
        console.log('✅ 받은 토큰:', token);
        localStorage.setItem('accessToken', token);
        setShowModal(true);
      })
      .catch((error) => {
        console.error('❌ 네트워크 또는 처리 오류:', error);
        if (error.message !== '회원가입 실패') {
          alert('서버 오류가 발생했습니다.');
        }
      });
  };

  const handleAddressSelect = (data: any) => {
    setForm((prev) => ({
      ...prev,
      businessAddress: data.address,
    }));
    setShowPostcode(false);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>concert-ticketing</h1>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {/* 기존 필드 */}
        <div className={styles.inputGroup}>
          <label htmlFor='username'>아이디</label>
          <input
            id='username'
            name='username'
            value={form.username}
            onChange={handleChange}
            className={styles.input}
          />
          {errors.username && <p className={styles.error}>{errors.username}</p>}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor='password'>비밀번호</label>
          <input
            id='password'
            name='password'
            type='password'
            value={form.password}
            onChange={handleChange}
            className={styles.input}
          />
          {errors.password && <p className={styles.error}>{errors.password}</p>}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor='businessName'>사업자 명</label>
          <input
            id='businessName'
            name='businessName'
            value={form.businessName}
            onChange={handleChange}
            className={styles.input}
          />
          {errors.businessName && <p className={styles.error}>{errors.businessName}</p>}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor='businessNumber'>사업자 번호</label>
          <input
            id='businessNumber'
            name='businessNumber'
            value={form.businessNumber}
            onChange={handleChange}
            className={styles.input}
          />
          {errors.businessNumber && (
            <p className={styles.error}>{errors.businessNumber}</p>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor='businessAddress'>사업자 소재지</label>
          <div className={styles.AddressArray}>
            <input
              id='businessAddress'
              name='businessAddress'
              value={form.businessAddress}
              readOnly
              className={styles.input}
            />
            <button
              type='button'
              onClick={() => setShowPostcode(true)}
              className={styles.addressButton}
            >
              주소 검색
            </button>
          </div>
          {errors.businessAddress && (
            <p className={styles.error}>{errors.businessAddress}</p>
          )}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor='email'>이메일</label>
          <input
            id='email'
            name='email'
            value={form.email}
            onChange={handleChange}
            className={styles.input}
          />
          {errors.email && <p className={styles.error}>{errors.email}</p>}
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor='phoneNumber'>핸드폰 번호</label>
          <input
            id='phoneNumber'
            name='phoneNumber'
            value={form.phoneNumber}
            onChange={handleChange}
            className={styles.input}
          />
          {errors.phoneNumber && <p className={styles.error}>{errors.phoneNumber}</p>}
        </div>

        <button type='submit' className={styles.submitButton}>
          회원가입
        </button>
      </form>

      {showModal && (
        <Modal
          onClose={() => {
            setShowModal(false);
            router.push('/'); // 홈으로 이동
          }}
        />
      )}
      {showPostcode && (
        <PostcodeModal
          onAddressSelect={handleAddressSelect}
          onClose={() => setShowPostcode(false)}
        />
      )}
    </div>
  );
}
