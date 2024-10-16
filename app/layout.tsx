import { ReactNode, Suspense } from 'react';
import { SessionProvider } from '@/components/SessionProvider';
import Header from '@/components/Header';
import '../styles/globals.css';
import Loading from '@/components/Loading';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <Header />
          <Suspense fallback={<Loading />}>{children}</Suspense>
        </SessionProvider>
      </body>
    </html>
  );
}
