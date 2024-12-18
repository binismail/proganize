"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChevronDown, ChevronsDown, Menu, Moon, Sun } from "lucide-react";
import Image from "next/image";
import logoBlack from "@/asset/proganize-dark-side.svg";
import logoWhite from "@/asset/proganize-light-side.svg";
import { useAppContext } from "@/app/context/appContext";
import { signIn, signOut } from "@/utils/supabaseOperations";
import { supabase } from "@/utils/supabase/instance";
import { UserProfilePopup } from "../shared/userProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

export default function Nav() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { state, dispatch } = useAppContext();
  const { user, subscriptionStatus, activeTab } = state;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

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
    <header className='flex py-2 items-center justify-between px-4 md:px-6 bg-background border-b w-full z-50'>
      <div className='flex items-center  gap-16'>
        <Link href='/' className='flex items-center space-x-2'>
          <Image alt='LOGO' src={theme === "light" ? logoBlack : logoWhite} />
        </Link>
      </div>
      <nav className='hidden md:flex gap-6'>
        {user ? (
          <>
            <div className='flex gap-10 py-1 px-5 bg-muted justify-between mx-auto rounded-md'>
              <button
                className={`text-sm rounded-md px-4 py-2 font-medium transition-colors duration-300 ${activeTab === "write" ? "bg-background" : ""}`}
                onClick={() =>
                  dispatch({ type: "SET_ACTIVE_TAB", payload: "write" })
                }
              >
                Write
              </button>
              <button
                className={`text-sm rounded-md font-medium px-4 py-2 transition-colors duration-300 ${activeTab === "chat" ? "bg-background" : ""}`}
                onClick={() =>
                  dispatch({ type: "SET_ACTIVE_TAB", payload: "chat" })
                }
              >
                Chat
              </button>
              <button
                className={`text-sm rounded-md px-4 py-2 font-medium transition-colors duration-300 ${activeTab === "bypass" ? "bg-background" : ""}`}
                onClick={() =>
                  dispatch({ type: "SET_ACTIVE_TAB", payload: "bypass" })
                }
              >
                Bypass
              </button>
            </div>
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
        <div
          className={`flex gap-2 cursor-pointer rounded-lg bg-muted p-2`}
          onClick={() => {
            setIsPopoverOpen(!isPopoverOpen);
          }}
        >
          <Avatar className='inline-block'>
            <AvatarImage
              className={`w-6 rounded-full`}
              src={user?.user_metadata.avatar_url}
              alt={user?.name}
            />
            <AvatarFallback>{user?.user_metadata.full_name[0]}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className='flex items-center gap-2'>
              <p className='text-sm'>{user?.user_metadata.full_name}</p>
              <ChevronDown size={15} />
            </div>
          )}
          {isPopoverOpen && ( // Render the popover conditionally
            <div className='absolute top-[70%] right-0 z-10 bg-background shadow-lg rounded-lg p-4'>
              <UserProfilePopup
                user={user}
                onSignOut={() => {}}
                subscriptionStatus={subscriptionStatus}
              />{" "}
              {/* Pass user data to UserProfile */}
            </div>
          )}
        </div>
        {mounted && (
          <Button
            variant='ghost'
            className='bg-muted'
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
      </div>
    </header>
  );
}
