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
  userId: string;
}

export function TopUpModal({ isOpen, onClose, userId }: TopUpModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [wordAmount, setWordAmount] = useState<number>(1000);
  const PRICE_PER_WORD = 0.002;

  const calculateTopUpPrice = (words: number) => {
    return words * PRICE_PER_WORD;
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
          unitPrice: PRICE_PER_WORD * wordAmount,
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
          <DialogTitle>Top Up Word Credits</DialogTitle>
          <DialogDescription>
            Purchase additional word credits for your account
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Number of Words</label>
            <Input
              type='number'
              min='1000'
              step='1000'
              value={wordAmount}
              onChange={(e) => setWordAmount(parseInt(e.target.value) || 0)}
              className='w-full'
            />
          </div>
          <div className='flex justify-between text-sm'>
            <span>Price per word:</span>
            <span>${PRICE_PER_WORD.toFixed(3)}</span>
          </div>
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
            disabled={isProcessing || wordAmount < 1000}
          >
            {isProcessing ? (
              <>
                <Spinner size='sm' className='mr-2' />
                Processing...
              </>
            ) : (
              "Purchase Credits"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
