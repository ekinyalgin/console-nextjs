"use client";
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';

export default function AdminHeader() {
  const { data: session } = useSession();

  return (
    <header className="bg-gray-800 text-white shadow-md">
      <nav className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/admin" className="text-xl font-bold mr-6">
              Admin Panel
            </Link>
            <Link href="/admin/users" className="text-gray-300 hover:text-white mr-4">
              Users
            </Link>
            <Link href="/admin/settings" className="text-gray-300 hover:text-white">
              Settings
            </Link>
          </div>
          <div className="flex items-center">
            {session?.user?.image && (
              <Image
                src={session.user.image}
                alt="User"
                width={32}
                height={32}
                className="rounded-full mr-2"
              />
            )}
            <span className="mr-4">{session?.user?.firstname}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}