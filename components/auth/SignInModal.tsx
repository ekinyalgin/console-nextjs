"use client";
import { ReactNode } from 'react';
import { signIn } from 'next-auth/react';
import { FaGoogle } from "react-icons/fa";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription  } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
}

export default function SignInModal({ isOpen, onClose }: ModalProps) {
  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center">Sign In</DialogTitle>
          <DialogDescription>
            Please sign in using your Google account to access all features.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Button onClick={handleGoogleSignIn} variant="destructive" className="w-full flex items-center justify-center">
            <FaGoogle className="mr-4" /> Sign In with Google
          </Button>
          <Button onClick={onClose} variant="secondary" className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
