"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Menu,
  Moon,
  Sun,
  Home,
  PenTool,
  FileText,
  Book,
  ChartBar,
  Settings,
  LogOut,
  LogIn,
} from "lucide-react";
import Image from "next/image";
import logoBlack from "@/asset/proganize-dark-side.svg";
import logoWhite from "@/asset/proganize-light-side.svg";
import { useAppContext } from "@/app/context/appContext";
import { signIn, signOut } from "@/utils/supabaseOperations";
import { supabase } from "@/utils/supabase/instance";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";
import { CreditDisplay } from "../shared/creditDisplay";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Icons } from "../ui/icons";

export default function Nav() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { state, dispatch } = useAppContext();
  const { user } = state;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Write", href: "/write", icon: PenTool },
    { name: "PDF Tools", href: "/pdf", icon: FileText },
    { name: "Study", href: "/study", icon: Book },
    { name: "Analytics", href: "/analytics", icon: ChartBar },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

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
  }, []);

  const handleGoogleAuth = async () => {
    if (user) {
      await signOut();
      dispatch({ type: "SET_CONVERSATION", payload: [] });
      dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: false });
      dispatch({ type: "SET_HAS_GENERATION_STARTED", payload: false });
      dispatch({ type: "SET_SHOW_INITIAL_CONTENT", payload: true });
      router.push("/");
    } else {
      await signIn();
    }
  };

  return (
    <nav
      className={cn(
        "flex flex-col h-screen border-r border-gray-200 dark:border-gray-800",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className='p-4 flex items-center justify-between'>
        {!isCollapsed && (
          <Link href='/'>
            <Image
              src={theme === "dark" ? logoWhite : logoBlack}
              alt='Proganize Logo'
              width={120}
              height={30}
              className='cursor-pointer'
            />
          </Link>
        )}
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <Menu className='h-4 w-4' />
        </Button>
      </div>

      <div className='flex-1 px-3 py-4 space-y-1'>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted",
                isCollapsed && "justify-center"
              )}
            >
              <item.icon
                className={cn("h-5 w-5", isCollapsed ? "mr-0" : "mr-3")}
              />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </div>

      <div className='flex flex-col h-full justify-between'>
        <div className='flex-1'></div>

        {/* Footer section */}
        <div className='border-t border-border py-4'>
          {/* Theme and Credits Row */}
          <div
            className={cn(
              "flex items-center gap-2 px-2 mb-4",
              isCollapsed ? "flex-col" : "justify-between"
            )}
          >
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className='h-8 w-8 shrink-0'
            >
              {theme === "dark" ? (
                <Sun className='h-4 w-4' />
              ) : (
                <Moon className='h-4 w-4' />
              )}
            </Button>
            <div
              className={cn(
                "flex items-center",
                isCollapsed && "w-full justify-center"
              )}
            >
              <CreditDisplay variant='minimal' />
            </div>
          </div>

          {/* User Section */}
          {user ? (
            <div className='px-2'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className={cn(
                      "w-full flex items-center gap-2",
                      isCollapsed ? "justify-center px-0" : "justify-start px-2"
                    )}
                  >
                    <Avatar className='h-6 w-6 shrink-0'>
                      <AvatarImage
                        src={user.user_metadata.avatar_url}
                        alt={user.user_metadata.full_name}
                      />
                      <AvatarFallback>
                        {user.user_metadata.full_name?.charAt(0) ||
                          user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                      <div className='flex flex-col items-start text-left overflow-hidden'>
                        <span className='text-sm font-medium truncate w-full'>
                          {user.user_metadata.full_name}
                        </span>
                        <span className='text-xs text-muted-foreground truncate w-full'>
                          {user.email}
                        </span>
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className='w-56' align='end' forceMount>
                  <DropdownMenuLabel className='font-normal'>
                    <div className='flex flex-col space-y-1'>
                      <p className='text-sm font-medium leading-none'>
                        {user.user_metadata.full_name}
                      </p>
                      <p className='text-xs leading-none text-muted-foreground'>
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className='h-4 w-4 mr-2' />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className='px-2'>
              <Button
                variant='default'
                className={cn("w-full", isCollapsed ? "px-0" : "")}
                onClick={handleGoogleAuth}
              >
                {isCollapsed ? (
                  <LogIn className='h-4 w-4' />
                ) : (
                  <div className='flex items-center gap-2'>
                    <Icons.google className='mr-2 h-4 w-4' />
                    Sign in with Google
                  </div>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
