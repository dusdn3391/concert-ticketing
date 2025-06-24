import React, { useState } from 'react';

import styles from './WriteAddress.module.css';

const WriteAddress = () => {
  const [isDeliverySelected, setIsDeliverySelected] = useState(false);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDeliverySelected(e.target.checked);
  };

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
            <form className={styles.form}>
              <label htmlFor='name'>이름</label>
              <input
                id='name'
                type='text'
                className={styles.inputBox}
                disabled={!isDeliverySelected}
                placeholder='이름을 입력하세요'
              />

              <label htmlFor='phone'>핸드폰 번호</label>
              <input
                id='phone'
                type='text'
                disabled={!isDeliverySelected}
                className={styles.inputBox}
                placeholder='010-0000-0000'
              />

              <label htmlFor='address'>배송지</label>
              <div className={styles.addressRow}>
                <input
                  id='address'
                  className={styles.inputBox}
                  type='text'
                  disabled={!isDeliverySelected}
                  placeholder='주소를 입력하세요'
                />
                <button
                  type='button'
                  disabled={!isDeliverySelected}
                  className={styles.findButton}
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
                placeholder='상세주소를 입력하세요'
              />
            </form>
          ) : (
            <p className={styles.notice}>배송하지 않는 상품입니다.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WriteAddress;
