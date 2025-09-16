import React, { useState, useEffect, ChangeEvent } from 'react';
import styles from './NoticeForm.module.css';
import { useRouter } from 'next/router';

type NoticeFormProps = {
  mode: 'create' | 'edit';
  onSubmit: (form: any) => void;
  initialData?: {
    id?: number;
    // 다른 초기값이 있다면 여기에 추가
  };
};

const NoticeForm = ({ mode, onSubmit, initialData }: NoticeFormProps) => {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'노출' | '비노출'>('노출');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // ✅ 수정 모드일 때 데이터 불러오기
  useEffect(() => {
    if (mode === 'edit' && initialData?.id) {
      const fetchNotice = async () => {
        try {
          const token = localStorage.getItem('admin_token');
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL}/api/notices/${initialData.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: '*/*',
              },
            },
          );

          if (!res.ok) throw new Error('공지사항 불러오기 실패');

          const data = await res.json();

          setTitle(data.title || '');
          setDescription(data.content || '');
          setStatus(data.visibility === 'VISIBLE' ? '노출' : '비노출');
          if (data.imageUrls?.length) {
            setImagePreview(data.imageUrls[0]);
          }
        } catch (err) {
          console.error('공지사항 조회 에러:', err);
          alert('공지사항을 불러오는 데 실패했습니다.');
        }
      };

      fetchNotice();
    }
  }, [mode, initialData]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('admin_token');
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    const visibility = status === '노출' ? 'VISIBLE' : 'HIDDEN';

    // FormData 생성
    const formData = new FormData();

    // request JSON 객체를 Blob으로 감싸서 formData에 추가
    const requestPayload = {
      title,
      content: description,
      visibility,
      imagePaths: imageFile ? ['string'] : [], // 필요 시 백엔드 요구사항에 맞게 수정
    };
    formData.append(
      'request',
      new Blob([JSON.stringify(requestPayload)], { type: 'application/json' }),
    );

    // 이미지 파일이 있을 경우 추가
    if (imageFile) {
      formData.append('images', imageFile, imageFile.name);
    }

    const apiUrl =
      mode === 'edit'
        ? `${process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL}/api/notices/${initialData?.id}`
        : `${process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL}/api/notices`;

    try {
      const response = await fetch(apiUrl, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: '*/*',
        },
        body: formData,
      });

      if (!response.ok) throw new Error(`${mode === 'edit' ? '수정' : '등록'} 실패`);

      const data = await response.json();
      console.log(`공지 ${mode === 'edit' ? '수정' : '등록'} 완료:`, data);

      alert(`공지사항이 ${mode === 'edit' ? '수정' : '등록'}되었습니다!`);
      router.push('/site-admin/notice');
    } catch (error) {
      console.error(`${mode === 'edit' ? '수정' : '등록'} 중 에러:`, error);
      alert(`공지사항 ${mode === 'edit' ? '수정' : '등록'}에 실패했습니다.`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label htmlFor='title'>제목</label>
      <input
        id='title'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <label htmlFor='description'>설명</label>
      <textarea
        id='description'
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={10}
      />

      <label htmlFor='status'>공개</label>
      <select
        id='status'
        value={status}
        onChange={(e) => setStatus(e.target.value as '노출' | '비노출')}
      >
        <option value='노출'>노출</option>
        <option value='비노출'>비노출</option>
      </select>

      <label htmlFor='image'>이미지 업로드</label>
      <input type='file' id='image' accept='image/*' onChange={handleImageChange} />

      {imagePreview && (
        <div className={styles.imagePreview}>
          <img src={imagePreview} alt='미리보기' />
        </div>
      )}

      <div className={styles.buttonGroup}>
        <button type='submit'>{mode === 'edit' ? '수정' : '등록'}</button>
      </div>
    </form>
  );
};

export default NoticeForm;
