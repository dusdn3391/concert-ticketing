import React, { useImperativeHandle, useRef, useState, forwardRef } from 'react';
import styles from './WriteAddress.module.css';
import PostcodeModal from '@/components/admin/concerts/concertCreate/PostcodeModal';

export type WriteAddressValues = {
  isDeliverySelected: boolean;
  name: string;
  phone: string;
  address: string;
  detail: string;
};

export type WriteAddressHandle = {
  getValues: () => WriteAddressValues;
  validate: () => boolean; // 배송 선택 시 필수값 체크
  reset: () => void;
};

type PostcodeResult = {
  address?: string;
  roadAddress?: string;
  jibunAddress?: string;
  buildingName?: string;
};

type Props = {
  initial?: Partial<WriteAddressValues>;
};

const WriteAddress = forwardRef<WriteAddressHandle, Props>(({ initial }, ref) => {
  const [isDeliverySelected, setIsDeliverySelected] = useState(
    initial?.isDeliverySelected ?? false,
  );
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [detail, setDetail] = useState(initial?.detail ?? '');

  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const detailRef = useRef<HTMLInputElement>(null);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDeliverySelected(e.target.checked);
  };

  const handleAddressSelect = (data: PostcodeResult) => {
    const picked = data.roadAddress || data.address || data.jibunAddress || '';
    setAddress(picked);
    setIsPostcodeOpen(false);
    setTimeout(() => detailRef.current?.focus(), 0);
  };

  // 부모에서 값을 읽고 검증/초기화할 수 있게 노출
  useImperativeHandle(
    ref,
    () => ({
      getValues: () => ({
        isDeliverySelected,
        name,
        phone,
        address,
        detail,
      }),
      validate: () => {
        if (!isDeliverySelected) return true;
        return !!(name.trim() && phone.trim() && address.trim());
      },
      reset: () => {
        setIsDeliverySelected(false);
        setName('');
        setPhone('');
        setAddress('');
        setDetail('');
      },
    }),
    [isDeliverySelected, name, phone, address, detail],
  );

  return (
    <div className={styles.leftPanel}>
      <div className={styles.layout}>
        <div className={styles.container}>
          <label className={styles.checkboxLabel}>
            <input
              type='checkbox'
              checked={isDeliverySelected}
              onChange={handleCheckboxChange}
            />
            배송 선택
          </label>

          {isDeliverySelected ? (
            <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
              <label htmlFor='name'>이름</label>
              <input
                id='name'
                type='text'
                className={styles.inputBox}
                disabled={!isDeliverySelected}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='이름을 입력하세요'
              />

              <label htmlFor='phone'>핸드폰 번호</label>
              <input
                id='phone'
                type='text'
                className={styles.inputBox}
                disabled={!isDeliverySelected}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder='010-0000-0000'
              />

              <label htmlFor='address'>배송지</label>
              <div className={styles.addressRow}>
                <input
                  id='address'
                  className={styles.inputBox}
                  type='text'
                  disabled={!isDeliverySelected}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder='주소를 입력하거나 ‘찾기’로 검색하세요'
                />
                <button
                  type='button'
                  disabled={!isDeliverySelected}
                  className={styles.findButton}
                  onClick={() => setIsPostcodeOpen(true)}
                >
                  찾기
                </button>
              </div>

              <label htmlFor='detail'>상세주소</label>
              <input
                id='detail'
                type='text'
                className={styles.inputBox}
                disabled={!isDeliverySelected}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                ref={detailRef}
                placeholder='상세주소를 입력하세요'
              />
            </form>
          ) : (
            <p className={styles.notice}>배송하지 않는 상품입니다.</p>
          )}
        </div>
      </div>

      {isPostcodeOpen && (
        <PostcodeModal
          onAddressSelect={handleAddressSelect}
          onClose={() => setIsPostcodeOpen(false)}
        />
      )}
    </div>
  );
});

WriteAddress.displayName = 'WriteAddress';
export default WriteAddress;
