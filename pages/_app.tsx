import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Script from 'next/script';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Load the Pi SDK globally */}
      <Script 
        src="https://sdk.minepi.com/pi-sdk.js" 
        strategy="afterInteractive" 
      />
      <Component {...pageProps} />
    </>
  );
}