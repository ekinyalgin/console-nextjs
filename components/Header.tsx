"use client";
import Link from 'next/link';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import SignInModal from './auth/SignInModal';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import {LockKeyhole } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="container mx-auto px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold mr-6">
              Your Logo
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900">
              About
            </Link>
          </div>
          <div className="flex items-center">
            {status === "loading" ? (
              <div>Loading...</div>
            ) : session ? (
              <div className="flex items-center">
                {session.user?.role === 1 && (
                  <Link href="/admin" className="mr-4 text-blue-600 hover:text-blue-800">
                    <LockKeyhole className='text-black w-5'/>
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
                  <DropdownMenuContent side='bottom' align='end'>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      {session.user?.email}
                    </DropdownMenuItem>
                    <DropdownMenuItem className='cursor-pointer' onSelect={(event) => {
                      event.preventDefault();
                      signOut();
                    }}>
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button
                onClick={() => setIsSignInModalOpen(true)}
                variant="outline"
              >
                Sign In
              </Button>
            )}
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