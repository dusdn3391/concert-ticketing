import "@/styles/globals.css";
import Header from "@/pages/components/Header";
import Footer from "@/pages/components/Footer";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Header />
      <Component {...pageProps} />
      <Footer />
    </>
  );
}
