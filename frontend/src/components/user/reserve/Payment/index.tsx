import React from 'react';

import ProgressNav from '../Navbar/ProgressNav';
import ConfirmPayment from './ConfirmPayment';
import styles from './Payment.module.css';
import { useDateStore } from '@/stores/dateStore';

const PaymentPage = () => {
  const { selectedSeats, seatCount, totalPrice } = useDateStore();

  return (
    <div className={styles.wrapper}>
      <ProgressNav />
      <div className={styles.container}>
        <ConfirmPayment />
      </div>
    </div>
  );
};

export default PaymentPage;
