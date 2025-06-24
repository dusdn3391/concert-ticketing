import React, { useEffect, useState } from 'react';

import styles from './WaitRoomLayout.module.css';

const WaitingRoomPage = () => {
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [canEnter, setCanEnter] = useState(false);

  useEffect(() => {
    // const interval = setInterval(async () => {
    //   const response = await fetch('/api/queue-status');
    //   const data = await response.json();
    //   setQueuePosition(data.position);
    //   setCanEnter(data.canEnter);
    //   if (data.canEnter) {
    //     clearInterval(interval);
    //   }
    // }, 3000);
    // return () => clearInterval(interval);
  }, []);

  const handleEnter = () => {
    if (!canEnter) return;
    window.open('/reserve/seat-select', '_blank', 'width=1000,height=800');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <h1 className={styles.title}>나의 대기순서</h1>
        <div className={styles.positionBox}>
          <span className={styles.queueNumber}>
            {queuePosition !== null ? String(queuePosition).padStart(2, '0') : '--'}
          </span>
        </div>
        <div className={styles.bar} />
        <p className={styles.info}>현재 접속 인원이 많아 대기중입니다</p>
        <p className={styles.subInfo}>잠시만 기다려주시면 예매하기 페이지로 연결됩니다</p>
        <p className={styles.warning}>
          새로고침 하거나 재접속 하시면 <br />
          대기순서가 초기화되어 대기시간이 더 길어집니다.
        </p>

        {canEnter && (
          <button className={styles.enterButton} onClick={handleEnter}>
            예매하러 가기
          </button>
        )}
      </div>
    </div>
  );
};

export default WaitingRoomPage;
