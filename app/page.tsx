'use client';

import React from 'react';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { status } = useSession(); // session değişkenini kaldırdık

  if (status === 'loading') {
    return <p>Loading...</p>; // Oturum durumu yüklenirken gösterilecek içerik
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-10">
      <h1 className="text-3xl font-bold mb-6">Welcome to Our Application</h1>
      <p>
        We are currently performing maintenance. Please check back later. Thank
        you for your understanding.
      </p>

      <h1 className="text-3xl font-bold mb-6 mt-10">Bakımdayız</h1>
      <p>
        Şu anda bakım yapıyoruz. Lütfen daha sonra tekrar kontrol edin.
        Anlayışınız için teşekkür ederiz.
      </p>
    </div>
  );
}
