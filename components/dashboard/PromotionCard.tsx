import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, Gift, Star } from "lucide-react";
import { useAppContext } from "@/app/context/appContext";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

interface PromotionCardProps {
  title: string;
  description: string;
  price: number;
  baseCredits: number;
  bonusCredits?: number;
  isSpecialOffer?: boolean;
  isHolidayOffer?: boolean;
}

export function PromotionCard({
  title,
  description,
  price,
  baseCredits,
  bonusCredits = 0,
  isSpecialOffer = false,
  isHolidayOffer = false,
}: PromotionCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { state } = useAppContext();
  const totalCredits = baseCredits + bonusCredits;

  const handlePurchase = async () => {
    if (!state.user?.id) {
      // Handle not logged in state
      return;
    }

    setIsProcessing(true);
    try {
      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
      );

      if (!stripe) {
        throw new Error("Stripe failed to initialize");
      }

      const response = await fetch("/api/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: state.user.id,
          creditAmount: totalCredits,
          unitPrice: price,
          isPromotion: isHolidayOffer || isSpecialOffer,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      // You might want to show a toast notification here
    } finally {
      setIsProcessing(false);
    }
  };

  const cardClass = isHolidayOffer
    ? "border-2 border-red-500 dark:border-red-400 bg-gradient-to-br from-red-50 to-transparent dark:from-red-950/30"
    : isSpecialOffer
      ? "border-2 border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-950/30"
      : "hover:border-primary/50";

  return (
    <Card
      className={`${cardClass} transition-all duration-300 hover:shadow-lg`}
    >
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              {title}
              {isHolidayOffer && (
                <span className='flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-normal text-red-600 dark:bg-red-900/50 dark:text-red-300'>
                  <Gift className='h-3 w-3' />
                  Holiday Special
                </span>
              )}
              {isSpecialOffer && !isHolidayOffer && (
                <span className='flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-normal text-blue-600 dark:bg-blue-900/50 dark:text-blue-300'>
                  <Star className='h-3 w-3' />
                  Popular Choice
                </span>
              )}
            </CardTitle>
            <CardDescription className='mt-2'>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='flex items-baseline justify-between'>
          <div className='flex items-baseline gap-1'>
            <span className='text-3xl font-bold'>${price}</span>
            <span className='text-sm text-muted-foreground'>one-time</span>
          </div>
          <div className='text-right'>
            <div className='text-lg font-semibold'>
              {totalCredits.toLocaleString()} words
            </div>
            {bonusCredits > 0 && (
              <div className='text-sm font-medium text-green-600 dark:text-green-400'>
                +{bonusCredits.toLocaleString()} bonus words
              </div>
            )}
          </div>
        </div>
        <div className='mt-4 text-sm text-muted-foreground'>
          <div className='flex items-center gap-2'>
            <Sparkles className='h-4 w-4' />
            <span>
              ${((price / totalCredits) * 1000).toFixed(2)} per 1000 words
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className='w-full'
          onClick={handlePurchase}
          variant={isHolidayOffer ? "destructive" : "default"}
          disabled={isProcessing || !state.user?.id}
        >
          {isProcessing ? (
            <>
              <span className='mr-2'>Processing...</span>
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
            </>
          ) : (
            "Get Started"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
