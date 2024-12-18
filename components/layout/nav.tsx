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
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container flex h-14 items-center justify-between'>
        <div className='mr-4 hidden md:flex'>
          <Link href='/' className='mr-6 flex items-center space-x-2'>
            <Image
              src={theme === "dark" ? logoWhite : logoBlack}
              alt='Proganize Logo'
              width={120}
              height={50}
              priority
            />
          </Link>
          <nav className='flex items-center space-x-6 text-sm font-medium'>
            <Link
              href='/'
              className={`transition-colors hover:text-foreground/80 ${
                activeTab === "writer"
                  ? "text-foreground"
                  : "text-foreground/60"
              }`}
              onClick={() =>
                dispatch({ type: "SET_ACTIVE_TAB", payload: "writer" })
              }
            >
              Write
            </Link>
            <Link
              href='/chat'
              className={`transition-colors hover:text-foreground/80 ${
                activeTab === "chat" ? "text-foreground" : "text-foreground/60"
              }`}
              onClick={() =>
                dispatch({ type: "SET_ACTIVE_TAB", payload: "chat" })
              }
            >
              Chat
            </Link>
            <Link
              href='/bypass'
              className={`transition-colors hover:text-foreground/80 ${
                activeTab === "bypass"
                  ? "text-foreground"
                  : "text-foreground/60"
              }`}
              onClick={() =>
                dispatch({ type: "SET_ACTIVE_TAB", payload: "bypass" })
              }
            >
              Bypass
            </Link>
          </nav>
        </div>
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
                alt={user?.user_metadata.full_namename}
              />
              <AvatarFallback>
                {user?.user_metadata.full_name[0]}
              </AvatarFallback>
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
      </div>
    </header>
  );
}
