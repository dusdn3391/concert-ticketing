import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/site-admin/common/Header';
import Nav from '@/components/site-admin/common/Nav';
import pageStyles from './NoticeList.module.css';
import Pagination from '@/components/user/common/Pagination';

const inquiriesPerPage = 5;

// 토큰이 필요한 이미지 컴포넌트
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

    // cleanup: object URL 해제
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

const NoticeListPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [notices, setNotices] = useState<
    {
      id: number;
      title: string;
      status: string;
      createdAt: string;
      imageUrl?: string | null;
    }[]
  >([]);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const token = localStorage.getItem('admin_token');
        if (!token) {
          alert('로그인이 필요합니다.');
          return;
        }

        const res = await fetch('http://localhost:8080/api/notices', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: '*/*',
          },
        });

        if (!res.ok) {
          const errorData = await res.json();
          alert(`공지사항 불러오기 실패: ${errorData.message || '오류 발생'}`);
          return;
        }

        const data = await res.json();

        // ✅ imageUrls → imageUrl 매핑
        const mapped = (Array.isArray(data) ? data : data.content).map((notice: any) => ({
          id: notice.id,
          title: notice.title,
          status: notice.visibility === 'VISIBLE' ? '노출' : '비노출',
          createdAt: notice.createdAt
            ? new Date(notice.createdAt).toISOString().slice(0, 10)
            : '-',
          imageUrl:
            notice.images?.length > 0 && notice.images[0].image
              ? `${process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL}${notice.images[0].image}`
              : null, // ✅ BASE_URL 추가
        }));

        console.log('공지 데이터 전체:', data);
        (Array.isArray(data) ? data : data.content).forEach(
          (notice: any, index: number) => {
            console.log(`==== 공지 ${index + 1} ====`);
            console.log('ID:', notice.id);
            console.log('Title:', notice.title);
            console.log('Images 배열:', notice.images); // ✅ 이미지 배열 전체
            if (Array.isArray(notice.images)) {
              notice.images.forEach((img: any, imgIndex: number) => {
                console.log(`  이미지 ${imgIndex + 1}:`, img);
              });
            }
          },
        );
        setNotices(mapped);
      } catch (error) {
        console.error('공지사항 조회 중 오류:', error);
        alert('공지사항을 불러오는 중 오류가 발생했습니다.');
      }
    };

    fetchNotices();
  }, []);

  const indexOfLast = currentPage * inquiriesPerPage;
  const indexOfFirst = indexOfLast - inquiriesPerPage;
  const currentNotices = notices.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(notices.length / inquiriesPerPage);

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const res = await fetch(`http://localhost:8080/api/notices/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: '*/*',
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(`삭제 실패: ${errorData.message || '오류 발생'}`);
        return;
      }

      // 삭제 성공 시 리스트에서 제거
      setNotices((prev) => prev.filter((notice) => notice.id !== id));
      alert('공지사항이 삭제되었습니다.');
    } catch (error) {
      console.error('공지사항 삭제 중 오류:', error);
      alert('공지사항 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className={pageStyles.wrapper}>
      <Header />
      <div className={pageStyles.body}>
        <Nav />
        <main className={pageStyles.content}>
          <div className={pageStyles.pageHeader}>
            <h2>공지사항 관리</h2>
            <Link href='/site-admin/notice/write' className={pageStyles.createBtn}>
              + 공지사항 등록
            </Link>
          </div>

          <table className={pageStyles.table}>
            <thead>
              <tr>
                <th>이미지</th>
                <th>제목</th>
                <th>등록일</th>
                <th>공개</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {currentNotices.length > 0 ? (
                currentNotices.map((notice) => (
                  <tr key={notice.id}>
                    <td>
                      {notice.imageUrl ? (
                        <AuthenticatedImage
                          src={notice.imageUrl}
                          alt={notice.title}
                          style={{ width: '60px', height: '40px', objectFit: 'cover' }}
                        />
                      ) : (
                        '없음'
                      )}
                    </td>
                    <td>{notice.title}</td>
                    <td>{notice.createdAt}</td>
                    <td>{notice.status}</td>
                    <td>
                      <Link
                        href={{
                          pathname: `/site-admin/notice/${notice.id}`,
                        }}
                        className={pageStyles.editBtn}
                      >
                        수정
                      </Link>
                      <button
                        className={pageStyles.deleteBtn}
                        onClick={() => handleDelete(notice.id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center' }}>
                    등록된 공지사항이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </main>
      </div>
    </div>
  );
};

export default NoticeListPage;
