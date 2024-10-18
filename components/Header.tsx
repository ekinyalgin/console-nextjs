'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import SignInModal from './auth/SignInModal';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { LockKeyhole } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Header() {
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="bg-gray-800 text-white border-b border-gray-200 shadow">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            Console
          </Link>

          <div className="flex space-x-10">
            <div className="flex items-center space-x-5 font-semibold text-sm">
              {session && session.user.role === 'admin' && (
                <>
                  <Link
                    href="/todos"
                    className="text-gray-100 hover:text-white transition"
                  >
                    Todos
                  </Link>
                  <Link
                    href="/sites"
                    className="text-gray-100 hover:text-white transition"
                  >
                    Sites
                  </Link>
                  <Link
                    href="/videos"
                    className="text-gray-100 hover:text-white transition"
                  >
                    Videos
                  </Link>
                  <Link
                    href="/exercises"
                    className="text-gray-100 hover:text-white transition"
                  >
                    Exercises
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center">
              {status === 'loading' ? (
                <div>Loading...</div>
              ) : session ? (
                <div className="flex items-center">
                  {session.user?.role === '1' && (
                    <Link
                      href="/admin"
                      className="mr-4 text-blue-600 hover:text-blue-800"
                    >
                      <LockKeyhole className="text-black w-5" />
                    </Link>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="focus:outline-none">
                      {session.user?.image ? (
                        <Image
                          src={session.user.image}
                          alt="User"
                          width={32}
                          height={32}
                          className="rounded-lg"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="end">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>{session.user?.email}</DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onSelect={(event) => {
                          event.preventDefault();
                          signOut();
                        }}
                      >
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <Button
                  onClick={() => setIsSignInModalOpen(true)}
                  variant="outline"
                  className="bg-transparent border-none text-transparent hover:bg-transparent hover:border-none hover:text-transparent cursor-default"
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>
      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />
    </header>
  );
}
