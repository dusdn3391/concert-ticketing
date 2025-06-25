import React from 'react';
import { useRouter } from 'next/router';

import ProgressNav from '../Navbar/ProgressNav';
import styles from './SeatSelect.module.css';
import LeftPanel from './SeatEntire';
import SelectedSeat from './SelectedSeat';

const SeatSelect = () => {
  const router = useRouter();

  const handlePrev = () => {
    router.push('/reserve/select-date');
  };

  const handleNext = () => {
    router.push('/reserve/confirm-ticket');
  };

  return (
    <div className={styles.wrapper}>
      <ProgressNav />
      <div className={styles.container}>
        <LeftPanel />
        <SelectedSeat onPrev={handlePrev} onNext={handleNext} />
      </div>
    </div>
  );
};

export default SeatSelect;
