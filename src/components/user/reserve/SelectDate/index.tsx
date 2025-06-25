import React from 'react';
import { useRouter } from 'next/router';

import ProgressNav from '../Navbar/ProgressNav';
import SelectDate from './Selecting';
import ConcertRightPanel from './ConcertInfos';
import styles from './ConcertDate.module.css';

const ConcertDate = () => {
  const router = useRouter();
  return (
    <div className={styles.wrapper}>
      <ProgressNav />
      <div className={styles.container}>
        <SelectDate />
        <ConcertRightPanel
          showNextButton
          onNextClick={() => router.push('/reserve/select-seat')}
        />{' '}
      </div>
    </div>
  );
};

export default ConcertDate;
