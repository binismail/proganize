"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icons } from "@/components/ui/icons";
import { signIn } from "@/utils/supabaseOperations";

export default function GoogleSignInPopup({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: any;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Welcome!</DialogTitle>
          <DialogDescription>
            Sign in with Google to access your account and continue.
          </DialogDescription>
        </DialogHeader>
        <div className='flex items-center justify-center py-4'>
          <Button
            variant='outline'
            className='w-full max-w-sm'
            onClick={signIn}
          >
            <Icons.google className='mr-2 h-4 w-4' />
            Sign in with Google
          </Button>
        </div>
        <div className='text-center text-sm text-muted-foreground'>
          By signing in, you agree to our{" "}
          <a href='#' className='underline hover:text-primary'>
            Terms of Service
          </a>{" "}
          and{" "}
          <a href='#' className='underline hover:text-primary'>
            Privacy Policy
          </a>
          .
        </div>
      </DialogContent>
    </Dialog>
  );
}
