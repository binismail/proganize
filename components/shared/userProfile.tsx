import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreditCard, LogOut, Users } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

interface UserProfilePopupProps {
  user: {
    user_metadata: any;
  };
  onUpgrade: () => void;
  onSignOut: () => void;
  subscriptionStatus: string;
}

export function UserProfilePopup({
  user,
  onUpgrade,
  onSignOut,
  subscriptionStatus,
}: UserProfilePopupProps) {
  const { theme, setTheme } = useTheme(); // Add state for theme

  const handleThemeChange = (selectedTheme: string) => {
    setTheme(selectedTheme);
    // Apply the theme to your application (this could be a context or a global state)
    // For example: document.body.setAttribute('data-theme', selectedTheme);
  };

  const handleChildClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent the popover from closing
  };

  return (
    <div className='w-80 bg-background border rounded-lg shadow-lg p-4'>
      <div
        className='flex items-center space-x-4 mb-4'
        onClick={handleChildClick}
      >
        <Avatar>
          <AvatarImage
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata.full_name}
          />
          <AvatarFallback>
            {user.user_metadata.full_name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className='text-sm font-medium'>{user.user_metadata.full_name}</p>
          <p className='text-sm text-muted-foreground'>
            {user.user_metadata.email}
          </p>
          <p className='text-sm font-medium'>
            {subscriptionStatus === "active" ? "Pro" : "Free"}
          </p>
        </div>
      </div>

      <Link href={"/billing"} passHref>
        <Button
          variant='outline'
          className='w-full justify-start'
          onClick={handleChildClick}
        >
          <CreditCard className='mr-2 h-4 w-4' />
          Billing
        </Button>
      </Link>

      <Button
        variant='outline'
        className='w-full justify-start mt-2'
        onClick={(e) => {
          handleChildClick(e);
          onSignOut();
        }}
      >
        <LogOut className='mr-2 h-4 w-4' />
        Sign Out
      </Button>

      <div className='mt-4'>
        <h3 className='text-sm font-medium mb-2'>Preferences</h3>
        <div className='flex justify-between items-center mb-2'>
          <span className='text-sm'>Theme</span>
          <div className='flex space-x-1'>
            <Button
              variant='outline'
              size='icon'
              className='w-8 h-8'
              onClick={(e) => {
                handleChildClick(e);
                handleThemeChange("system");
              }}
            >
              <span className='sr-only'>System theme</span>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'
                className='w-4 h-4'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.597 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25'
                />
              </svg>
            </Button>
            <Button
              variant='outline'
              size='icon'
              className='w-8 h-8'
              onClick={(e) => {
                handleChildClick(e);
                handleThemeChange("light");
              }}
            >
              <span className='sr-only'>Light theme</span>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'
                className='w-4 h-4'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z'
                />
              </svg>
            </Button>
            <Button
              variant='outline'
              size='icon'
              className='w-8 h-8'
              onClick={(e) => {
                handleChildClick(e);
                handleThemeChange("dark");
              }}
            >
              <span className='sr-only'>Dark theme</span>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={1.5}
                stroke='currentColor'
                className='w-4 h-4'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z'
                />
              </svg>
            </Button>
          </div>
        </div>
        <div className='flex justify-between items-center'>
          <span className='text-sm'>Language</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                className='w-24'
                onClick={handleChildClick}
              >
                English
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleChildClick}>
                English
              </DropdownMenuItem>
              {/* Add other languages here with onClick={handleChildClick} */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Button
        className='w-full mt-4'
        onClick={(e) => {
          handleChildClick(e);
          onUpgrade();
        }}
      >
        Upgrade Plan
      </Button>
    </div>
  );
}
