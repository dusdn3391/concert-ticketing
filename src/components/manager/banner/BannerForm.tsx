// /components/manager/banner/BannerForm.tsx
import { useState, useEffect, ChangeEvent } from 'react';
import styles from './BannerForm.module.css';

type BannerFormProps = {
  mode: 'create' | 'edit';
  initialData?: {
    title: string;
    description?: string;
    status: '노출' | '비노출';
    imageUrl?: string;
  };
  onSubmit: (form: {
    title: string;
    description: string;
    status: '노출' | '비노출';
    imageFile: File | null;
  }) => void;
};

const BannerForm = ({ mode, initialData, onSubmit }: BannerFormProps) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState<'노출' | '비노출'>(initialData?.status || '노출');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, description, status, imageFile });
  };

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
};

export default BannerForm;
