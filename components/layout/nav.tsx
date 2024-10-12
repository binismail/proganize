"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Moon, Sun } from "lucide-react";
import Image from "next/image";
import logoBlack from "@/asset/prorganize-logo.svg";
import logoWhite from "@/asset/prorganize-white.svg";
import { createClient } from "@/utils/supabase/client";
import { useAppContext } from "@/app/context/appContext";
import { signIn, signOut } from "@/utils/supabaseOperations";
import { supabase } from "@/utils/supabase/instance";

export default function Nav() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { state, dispatch } = useAppContext();
  const { user } = state;

  useEffect(() => {
    setMounted(true);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        dispatch({ type: "SET_USER", payload: session?.user ?? null });
      } else if (event === "SIGNED_OUT") {
        dispatch({ type: "SET_USER", payload: null });
        dispatch({ type: "SET_DOCUMENTS", payload: [] });
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleGoogleAuth = async () => {
    if (user) {
      // Logout
      await signOut();
      dispatch({ type: "SET_CONVERSATION", payload: [] });
      dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: false });
      dispatch({ type: "SET_HAS_GENERATION_STARTED", payload: false });
      dispatch({ type: "SET_SHOW_INITIAL_CONTENT", payload: true });
    } else {
      await signIn();
    }
  };

  return (
    <header className='flex h-16 items-center justify-between px-4 md:px-6 bg-background border-b'>
      <Link href='/' className='flex items-center space-x-2'>
        <Image alt='LOGO' src={theme === "light" ? logoBlack : logoWhite} />
      </Link>
      <nav className='hidden md:flex gap-6'>
        {user ? (
          <>
            <Link
              className='text-sm font-medium hover:underline underline-offset-4'
              href='/account-setting'
            >
              Account Settings
            </Link>
            <Link
              className='text-sm font-medium hover:underline underline-offset-4'
              href='/billing'
            >
              Billing
            </Link>
            <Link
              className='text-sm font-medium hover:underline underline-offset-4'
              href='/templates'
            >
              Templates
            </Link>
          </>
        ) : (
          <>
            <Link
              className='text-sm font-medium hover:underline underline-offset-4'
              href='/pricing'
            >
              Pricing
            </Link>
            <Link
              className='text-sm font-medium hover:underline underline-offset-4'
              href='/templates'
            >
              Templates
            </Link>
          </>
        )}
      </nav>
      <div className='flex items-center gap-4'>
        <Button
          onClick={handleGoogleAuth}
          variant='outline'
          className='hidden md:flex'
        >
          {user
            ? `Logout (${user?.user_metadata?.full_name.split(" ")[0]})`
            : "Login with Google"}
        </Button>
        {mounted && (
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label='Toggle theme'
          >
            {theme === "light" ? (
              <Moon className='h-6 w-6' />
            ) : (
              <Sun className='h-6 w-6' />
            )}
          </Button>
        )}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant='outline' size='icon' className='md:hidden'>
              <Menu className='h-6 w-6' />
              <span className='sr-only'>Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side='right'>
            <nav className='flex flex-col gap-4'>
              <Link
                className='text-sm font-medium hover:underline underline-offset-4'
                href='/pricing'
              >
                Pricing
              </Link>
              <Link
                className='text-sm font-medium hover:underline underline-offset-4'
                href='/templates'
              >
                Templates
              </Link>
              <Button variant='outline' onClick={handleGoogleAuth}>
                {user
                  ? `Logout (${user.user_metadata.full_name.split(" ")[0]})`
                  : "Login with Google"}
              </Button>
              {mounted && (
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                >
                  {theme === "light" ? (
                    <>
                      <Moon className='mr-2 h-4 w-4' />
                      Dark mode
                    </>
                  ) : (
                    <>
                      <Sun className='mr-2 h-4 w-4' />
                      Light mode
                    </>
                  )}
                </Button>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
