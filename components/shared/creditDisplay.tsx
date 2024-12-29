"use client";

import { useAppContext } from "@/app/context/appContext";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Coins, AlertCircle } from "lucide-react";

interface CreditDisplayProps {
  variant?: "full" | "compact" | "minimal";
  showTopUpButton?: boolean;
  className?: string;
}

export function CreditDisplay({
  variant = "full",
  showTopUpButton = true,
  className = "",
}: CreditDisplayProps) {
  const { state, dispatch } = useAppContext();
  const credits = state.wordCredits?.remaining_credits || 0;
  const isLowCredits = credits < 1000; // Show warning when credits are low

  const handleTopUp = () => {
    dispatch({ type: "SET_SHOW_TOPUP_MODAL", payload: true });
  };

  if (variant === "minimal") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 ${className}`}>
              <Coins className='h-4 w-4' />
              <span className='text-sm'>{credits.toLocaleString()}</span>
              {isLowCredits && (
                <AlertCircle className='h-4 w-4 text-yellow-500' />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>AI Credits Remaining</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className='flex items-center gap-1'>
          <Coins className='h-4 w-4' />
          <span className='text-sm font-medium'>
            {credits.toLocaleString()} credits
          </span>
          {isLowCredits && <AlertCircle className='h-4 w-4 text-yellow-500' />}
        </div>
        {showTopUpButton && (
          <Button size='sm' variant='outline' onClick={handleTopUp}>
            Top Up
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Coins className='h-5 w-5' />
          <div>
            <p className='text-sm font-medium'>
              {credits.toLocaleString()} AI credits remaining
            </p>
            {isLowCredits && (
              <p className='text-sm text-yellow-500'>
                Running low on credits! Top up to continue using AI features.
              </p>
            )}
          </div>
        </div>
        {showTopUpButton && (
          <Button variant='outline' onClick={handleTopUp}>
            Top Up Credits
          </Button>
        )}
      </div>
    </div>
  );
}
