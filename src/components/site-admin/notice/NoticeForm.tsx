import { useState, ChangeEvent } from 'react';
import styles from './NoticeForm.module.css';
import { useRouter } from 'next/router';

type NoticeFormProps = {
  mode: 'create' | 'edit';
  initialData?: {
    id?: number; // 👈 수정 시 id 필요
    title: string;
    description?: string;
    status: string;
    imageUrl?: string;
  };
  onSubmit?: (form: {
    title: string;
    status: string;
    description: string;
    imageFile: File | null;
  }) => void;
};

const NoticeForm = ({ mode, initialData }: NoticeFormProps) => {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState(initialData?.status || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl || null,
  );

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const visibility = status === '노출' ? 'VISIBLE' : 'HIDDEN';
    const imagePaths = imageFile ? ['example.jpg'] : [];

    const token = localStorage.getItem('admin_token');
    const apiUrl =
      mode === 'edit'
        ? `http://localhost:8080/api/notices/${initialData?.id}`
        : 'http://localhost:8080/api/notices';

    try {
      const response = await fetch(apiUrl, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content: description,
          visibility,
          imagePaths,
        }),
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
