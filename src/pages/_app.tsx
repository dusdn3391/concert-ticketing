import "@/styles/globals.css";
import Header from "@/pages/components/Header";
import Footer from "@/pages/components/Footer";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAdminRoute = router.pathname.startsWith("/admin");

  return (
    <>
      {!isAdminRoute && <Header />}
      <Component {...pageProps} />
      {!isAdminRoute && <Footer />}
    </>
  );
}
