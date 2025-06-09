import React, { useState } from 'react';

import styles from './MyInfo.module.css';
import MypageNav from '@/components/user/MypageNav';

interface User {
  email: string;
  nickname: string;
  phone: string;
  birthday: string;
  provider: string;
  gender: string;
  emailAgree: boolean;
  smsAgree: boolean;
}
const mockUserData: User = {
  email: 'dusdn3391@naver.com',
  nickname: '페아키',
  phone: '010-1234-5678',
  birthday: '1998년 4월 29일',
  provider: 'kakao',
  gender: '여',
  emailAgree: true,
  smsAgree: false,
};

const maskEmail = (email: string) => {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  const masked = local[0] + '*'.repeat(local.length - 2) + local[local.length - 1];
  return `${masked}@${domain}`;
};

const maskPhone = (phone: string) => {
  return phone.replace(/(\d{3}-\d{4})-\d{4}/, '$1-****');
};

export default function MyInfo() {
  const [emailAgree, setEmailAgree] = useState(mockUserData.emailAgree);
  const [smsAgree, setSmsAgree] = useState(mockUserData.smsAgree);
  const [modalMessage, setModalMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleAgreeClick = (type: 'email' | 'sms', agree: boolean) => {
    if (type === 'email') {
      setEmailAgree(agree);
      setModalMessage(`이메일 수신 ${agree ? '동의' : '거부'}를 하였습니다.`);
    } else {
      setSmsAgree(agree);
      setModalMessage(`SMS 수신 ${agree ? '동의' : '거부'}를 하였습니다.`);
    }
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const getProviderColor = (provider: string): string => {
    if (provider === 'naver') return '#1EC800';
    if (provider === 'kakao') return '#FEE500';
    return '#ffffff';
  };
  return (
    <div className={styles.all}>
      <div className={styles.margin}>
        <div>
          <h1 className={styles.title}>마이페이지</h1>
        </div>
        <div className={styles.container}>
          <MypageNav />
          <section className={styles.content}>
            <div className={styles.myinfo}>
              <div className={styles.myinfoTitle}>내정보</div>
              <div className={styles.wrapper}>
                <table className={styles.table}>
                  <tbody>
                    <tr>
                      <th>이메일</th>
                      <td>{maskEmail(mockUserData.email)}</td>
                    </tr>
                    <tr>
                      <th>닉네임</th>
                      <td>
                        <input
                          type='text'
                          placeholder='닉네임'
                          defaultValue={mockUserData.nickname}
                          className={styles.input}
                        />
                      </td>
                    </tr>
                    <tr>
                      <th>핸드폰번호</th>
                      <td>
                        {maskPhone(mockUserData.phone)}
                        <button className={styles.editButton}>수정</button>
                      </td>
                    </tr>
                    <tr>
                      <th>생일</th>
                      <td>{mockUserData.birthday}</td>
                    </tr>
                    <tr>
                      <th>가입경로</th>
                      <td className={styles.provider}>
                        <span
                          className={styles.providerDot}
                          style={{
                            backgroundColor: getProviderColor(mockUserData.provider),
                          }}
                        />
                        {mockUserData.provider}
                      </td>
                    </tr>
                    <tr>
                      <th>이메일 수신 동의</th>
                      <td>
                        <button
                          className={styles.agree}
                          style={{
                            backgroundColor: emailAgree ? '#f5f5f5' : 'white',
                          }}
                          onClick={() => handleAgreeClick('email', true)}
                        >
                          동의
                        </button>
                        <button
                          className={styles.disagree}
                          style={{
                            backgroundColor: !emailAgree ? '#f5f5f5' : 'white',
                          }}
                          onClick={() => handleAgreeClick('email', false)}
                        >
                          거부
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <th>SMS 수신 동의</th>
                      <td>
                        <button
                          className={styles.agree}
                          style={{
                            backgroundColor: smsAgree ? '#f5f5f5' : 'white',
                          }}
                          onClick={() => handleAgreeClick('sms', true)}
                        >
                          동의
                        </button>
                        <button
                          className={styles.disagree}
                          style={{
                            backgroundColor: !smsAgree ? '#f5f5f5' : 'white',
                          }}
                          onClick={() => handleAgreeClick('sms', false)}
                        >
                          거부
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <th>성별</th>
                      <td>{mockUserData.gender}</td>
                    </tr>
                  </tbody>
                </table>

                <div className={styles.submitWrapper}>
                  <button className={styles.submit}>회원정보 수정</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* 모달 영역 */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal}>
            <p>{modalMessage}</p>
            <button onClick={closeModal}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}
