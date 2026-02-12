import '@/styles/globals.css'; // Ensure this path is correct
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}