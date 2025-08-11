import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/router';
import styles from './BannerForm.module.css';

type BannerFormProps = {
  mode: 'edit' | 'create';
  initialData?: {
    title: string;
    description: string;
    status: '노출' | '비노출';
    imageUrl?: string;
  };
  id?: string;
  onSubmit: (form: any) => void;
};

export default function BannerForm({ mode, initialData, id, onSubmit }: BannerFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState<'노출' | '비노출'>(initialData?.status || '노출');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl || null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && id) {
      const fetchBanner = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('admin_token');
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL}/api/banners/${id}`,
            {
              headers: {
                Accept: '*/*',
                Authorization: `Bearer ${token}`,
              },
            },
          );
          if (!res.ok) {
            throw new Error('배너 정보를 불러오는데 실패했습니다.');
          }
          const data = await res.json();

          setTitle(data.title);
          setDescription(data.description);
          setStatus(data.status === 'SHOW' ? '노출' : '비노출');
          setImagePreview(data.imageUrl || null);
        } catch (err) {
          alert(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
        } finally {
          setLoading(false);
        }
      };

      fetchBanner();
    }
  }, [mode, id]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!title.trim() || !description.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        alert('로그인이 필요합니다.');
        return;
      }

      const formData = new FormData();

      formData.append(
        'request',
        new Blob(
          [
            JSON.stringify({
              title,
              description,
              status: status === '노출' ? 'SHOW' : 'HIDE',
            }),
          ],
          { type: 'application/json' },
        ),
      );

      if (imageFile) {
        const imageBlob = new Blob([imageFile], { type: 'application/json' });
        formData.append('image', imageBlob, imageFile.name);
      }

      let url = '';
      let method: 'POST' | 'PUT' = 'POST';

      if (mode === 'create') {
        url = `${process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL}/api/banners/create`;
        method = 'POST';
      } else if (mode === 'edit' && id) {
        url = `${process.env.NEXT_PUBLIC_API_LOCAL_BASE_URL}/api/banners/${id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('오류:', errorData);
        alert(`저장에 실패했습니다: ${errorData?.message || '오류 발생'}`);
        return;
      }

      alert(
        mode === 'create'
          ? '배너가 성공적으로 등록되었습니다.'
          : '배너가 성공적으로 수정되었습니다.',
      );
      router.push('/site-admin/banner');
    } catch (error) {
      console.error('서버 오류:', error);
      alert('서버 요청 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return <p>배너 정보를 불러오는 중입니다...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label htmlFor='title'>제목</label>
      <input
        id='title'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder='배너 제목을 입력하세요'
        required
      />

      <label htmlFor='description'>설명</label>
      <textarea
        id='description'
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder='배너 설명을 입력하세요'
        rows={4}
      />

      <label htmlFor='image'>이미지 업로드</label>
      <input type='file' id='image' accept='image/*' onChange={handleImageChange} />

      {imagePreview && (
        <div className={styles.imagePreview}>
          <img src={imagePreview} alt='미리보기' />
        </div>
      )}

      <label htmlFor='status'>노출 상태</label>
      <select
        id='status'
        value={status}
        onChange={(e) => setStatus(e.target.value as '노출' | '비노출')}
      >
        <option value='노출'>노출</option>
        <option value='비노출'>비노출</option>
      </select>

      <div className={styles.buttonGroup}>
        <button type='submit'>{mode === 'edit' ? '수정' : '등록'}</button>
      </div>
    </form>
  );
}
