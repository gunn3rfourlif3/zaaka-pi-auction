import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Script from 'next/script';
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Load the Pi SDK globally as early as possible */}
      <Script 
        src="https://sdk.minepi.com/pi-sdk.js" 
        strategy="beforeInteractive" 
      />
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '16px',
            fontSize: '14px',
            padding: '12px 16px',
          },
          success: {
            style: {
              background: '#22c55e',
            },
          },
          error: {
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
      <Component {...pageProps} />
    </>
  );
}