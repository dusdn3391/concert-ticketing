import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import EntireMypagePage from '@/components/user/mypage/EntireMypage';
import LoginModal from '@/components/user/common/LoginModal';

export default function Mypage() {
  const [hasToken, setHasToken] = useState<boolean | null>(null); // null: 아직 확인 전
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      setHasToken(true);
    } else {
      setHasToken(false);
      setShowModal(true);
    }
  }, []);

  const handleCloseModal = () => {
    setShowModal(false);
    router.push('/login');
  };

  if (hasToken === null) return null;

  return (
    <>
      {showModal && <LoginModal onClose={handleCloseModal} />}
      {hasToken && <EntireMypagePage />}
    </>
  );
}
