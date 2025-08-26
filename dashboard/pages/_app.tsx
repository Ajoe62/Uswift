import type { AppProps } from 'next/app';
import Link from 'next/link';
import '../styles/globals.module.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <nav style={{background:'linear-gradient(90deg,#1cb5e0 0%,#000851 100%)',padding:'1rem',display:'flex',gap:'1rem'}}>
        <Link href="/LandingPage" style={{color:'#fff',fontWeight:700}}>Home</Link>
        <Link href="/Pricing" style={{color:'#fff'}}>Pricing</Link>
        <Link href="/Profile" style={{color:'#fff'}}>Profile</Link>
        <Link href="/Support" style={{color:'#fff'}}>Support</Link>
        <Link href="/Dashboard" style={{color:'#fff'}}>Dashboard</Link>
        <Link href="/JobTracker" style={{color:'#fff'}}>Job Tracker</Link>
      </nav>
      <Component {...pageProps} />
    </>
  );
}
