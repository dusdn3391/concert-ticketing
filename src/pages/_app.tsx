import '@/styles/globals.css';
import { useRouter } from 'next/router';
import { useEffect } from 'react'; // 🔹 useEffect import 필요

import type { AppProps } from 'next/app';

import Header from '@/components/user/common/Header';
import Footer from '@/components/user/common/Footer';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const hiddenLayoutPaths = ['/admin', '/waitroom', '/reserve'];
  const isHiddenLayoutRoute = hiddenLayoutPaths.some((path) =>
    router.pathname.startsWith(path),
  );

  return (
    <>
      {!isHiddenLayoutRoute && <Header />}
      <Component {...pageProps} />
      {!isHiddenLayoutRoute && <Footer />}
    </>
  );
}
