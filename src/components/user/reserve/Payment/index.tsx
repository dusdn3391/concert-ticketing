import React from 'react';

import ProgressNav from '../Navbar/ProgressNav';
import ConfirmPayment from './ConfirmPayment';
import styles from './Payment.module.css';

const PaymentPage = () => {
  //   const router = useRouter();

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
