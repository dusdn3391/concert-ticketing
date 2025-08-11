// 기존 import들과 상태 유지
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/site-admin/common/Header';
import Nav from '@/components/site-admin/common/Nav';
import pageStyles from './Admin.module.css';

interface Banner {
  id: number;
  title: string;
  status: 'SHOW' | 'HIDE';
  createdAt: string;
  imageUrl: string;
}

const AuthenticatedImage = ({
  src,
  alt,
  style,
}: {
  src: string;
  alt: string;
  style?: React.CSSProperties;
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        if (!token) {
          setImageError(true);
          return;
        }

        const response = await fetch(src, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('이미지 로드 실패');
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
      } catch (err) {
        console.error('이미지 로딩 오류:', err);
        setImageError(true);
      }
    };

    if (src) {
      fetchImage();
    }

    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src]);

  if (imageError) {
    return <span>이미지 로드 실패</span>;
  }

  if (!imageSrc) {
    return <span>로딩 중...</span>;
  }

  return <img src={imageSrc} alt={alt} style={style} />;
};

const BannerListPage = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBanners = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setError('로그인이 필요합니다.');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL}/api/banners`,
        {
          method: 'GET',
          headers: {
            Accept: '*/*',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '배너 불러오기 실패');
      }

      const data = await response.json();
      const mapped = data.map((banner: any) => ({
        ...banner,
        imageUrl: banner.imageUrl
          ? `${process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL}${banner.imageUrl}`
          : null,
      }));

      setBanners(mapped);
    } catch (err) {
      console.error('배너 로딩 오류:', err);
      setError(err instanceof Error ? err.message : '배너를 불러오는 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('정말로 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL}/api/banners/${id}`,
        {
          method: 'DELETE',
          headers: {
            Accept: '*/*',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '삭제 실패');
      }

      // 삭제 성공 시 목록에서 제거
      setBanners((prev) => prev.filter((banner) => banner.id !== id));
    } catch (err) {
      console.error('삭제 오류:', err);
      alert(err instanceof Error ? err.message : '삭제 중 오류 발생');
    }
  };

  return (
    <div className={pageStyles.wrapper}>
      <Header />
      <div className={pageStyles.body}>
        <Nav />
        <main className={pageStyles.content}>
          <div className={pageStyles.pageHeader}>
            <h2>배너 관리</h2>
            <Link href='/site-admin/banner/write' className={pageStyles.createBtn}>
              + 배너 등록
            </Link>
          </div>

          {loading ? (
            <p>배너를 불러오는 중...</p>
          ) : error ? (
            <p className={pageStyles.error}>{error}</p>
          ) : (
            <table className={pageStyles.table}>
              <thead>
                <tr>
                  <th>이미지</th>
                  <th>제목</th>
                  <th>상태</th>
                  <th>등록일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((banner) => (
                  <tr key={banner.id}>
                    <td>
                      {banner.imageUrl ? (
                        <AuthenticatedImage
                          src={banner.imageUrl}
                          alt={banner.title}
                          style={{ width: '100px', height: 'auto' }}
                        />
                      ) : (
                        <span>이미지 없음</span>
                      )}
                    </td>
                    <td>{banner.title}</td>
                    <td>{banner.status === 'SHOW' ? '노출' : '비노출'}</td>
                    <td>{new Date(banner.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link
                        href={{
                          pathname: `/site-admin/banner/${banner.id}`,
                          query: {
                            title: banner.title,
                            status: banner.status === 'SHOW' ? '노출' : '비노출',
                          },
                        }}
                        className={pageStyles.editBtn}
                      >
                        수정
                      </Link>
                      <button
                        className={pageStyles.deleteBtn}
                        onClick={() => handleDelete(banner.id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </main>
      </div>
    </div>
  );
};

export default BannerListPage;
