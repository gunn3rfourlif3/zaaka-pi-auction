import "../styles/globals.css";
import type { AppProps } from "next/app"; 
import Script from "next/script"; 
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) { useEffect(() => { const initPi = async () => { if (typeof window !== "undefined" && (window as any).Pi) { try { await (window as any).Pi.init({ version: "2.0", sandbox: true }); console.log("Pi SDK Initialized"); } catch (err) { console.error("Pi SDK Init Error:", err); } } }; initPi(); }, []);

return ( <> <Script src="" strategy="beforeInteractive" /> <Component {...pageProps} /> </> ); }