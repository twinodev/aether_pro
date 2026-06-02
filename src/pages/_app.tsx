import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import '../index.css';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Unregister any active, old service workers to prevent stale background cache/routing interception
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
          console.log('Unregistered stale service worker:', registration);
        }
      }).catch((err) => {
        console.error('Failed to unregister stale service worker:', err);
      });
    }
  }, []);

  return (
    <AuthProvider>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </AuthProvider>
  );
}
