import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/shared/spinner";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  fixedAmount?: {
    credits: number;
    price: number;
  };
}

export function TopUpModal({
  isOpen,
  onClose,
  userId,
  fixedAmount,
}: TopUpModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [wordAmount, setWordAmount] = useState<number>(
    fixedAmount?.credits || 1000
  );
  const PRICE_PER_WORD = fixedAmount
    ? fixedAmount.price / fixedAmount.credits
    : 0.002;

  const calculateTopUpPrice = (words: number) => {
    return fixedAmount ? fixedAmount.price : words * PRICE_PER_WORD;
  };

  const handleTopUpSubmit = async () => {
    setIsProcessing(true);
    const stripe = await loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
    );
    if (!stripe) {
      return;
    }

    try {
      const response = await fetch("/api/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          creditAmount: wordAmount,
          unitPrice: fixedAmount
            ? fixedAmount.price
            : PRICE_PER_WORD * wordAmount,
          isPromotion: !!fixedAmount,
        }),
      });

      const data = await response.json();
      await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });
    } catch (error) {
      console.error("Error creating top-up session:", error);
      alert("Failed to process top-up request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {fixedAmount ? "Confirm Purchase" : "Top Up Word Credits"}
          </DialogTitle>
          <DialogDescription>
            {fixedAmount
              ? "Confirm your special offer purchase"
              : "Purchase additional word credits for your account"}
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Number of Words</label>
            {fixedAmount ? (
              <div className='text-lg font-semibold'>
                {fixedAmount.credits.toLocaleString()} words
              </div>
            ) : (
              <Input
                type='number'
                min='1000'
                step='1000'
                value={wordAmount}
                onChange={(e) => setWordAmount(parseInt(e.target.value) || 0)}
                className='w-full'
              />
            )}
          </div>
          {!fixedAmount && (
            <div className='flex justify-between text-sm'>
              <span>Price per word:</span>
              <span>${PRICE_PER_WORD.toFixed(3)}</span>
            </div>
          )}
          <div className='flex justify-between font-medium'>
            <span>Total Price:</span>
            <span>${calculateTopUpPrice(wordAmount).toFixed(2)}</span>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleTopUpSubmit}
            disabled={isProcessing || (!fixedAmount && wordAmount < 1000)}
          >
            {isProcessing ? (
              <>
                <Spinner className='mr-2 h-4 w-4' />
                Processing...
              </>
            ) : (
              `Purchase ${fixedAmount ? "Package" : "Credits"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
