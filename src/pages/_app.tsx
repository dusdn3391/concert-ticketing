import '@/styles/globals.css';
import { useRouter } from 'next/router';

import type { AppProps } from 'next/app';

import Header from '@/components/user/Header';
import Footer from '@/components/user/Footer';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAdminRoute = router.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Header />}
      <Component {...pageProps} />
      {!isAdminRoute && <Footer />}
    </>
  );
}
