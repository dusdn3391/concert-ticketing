import React from 'react';
import { useRouter } from 'next/router';

import ProgressNav from '../Navbar/ProgressNav';
import styles from './ConfirmTicket.module.css';
import LeftPanel from './WriteAddress';
import RightPanel from '../SelectDate/ConcertInfos';

const CombineTicketPage = () => {
  const router = useRouter();

  return (
    <div className={styles.wrapper}>
      <ProgressNav />
      <div className={styles.container}>
        <LeftPanel />
        <RightPanel
          showPrevButton
          showNextButton
          onPrevClick={() => router.push('/reserve/select-seat')}
          onNextClick={() => router.push('/reserve/payment')}
        />
      </div>
    </div>
  );
};

export default CombineTicketPage;
