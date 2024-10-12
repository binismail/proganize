import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Check } from "lucide-react";
import { useAppContext } from "@/app/context/appContext";
import { loadStripe } from "@stripe/stripe-js";
import { Spinner } from "./spinner";

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (isAnnual: boolean) => void;
  plan: {
    name: string;
    monthlyPrice: number;
    features: string[];
  };
  initialIsAnnual: boolean;
  annualDiscount: number;
}

export function SubscribeModal({
  isOpen,
  onClose,
  onSubscribe,
  plan,
  initialIsAnnual,
  annualDiscount,
}: SubscribeModalProps) {
  const [isAnnual, setIsAnnual] = useState(initialIsAnnual);
  const { state } = useAppContext();
  const { user } = state;
  const [loading, setLoading] = useState(false);

  const price = isAnnual
    ? (plan.monthlyPrice * 12 * (1 - annualDiscount)).toFixed(2)
    : plan.monthlyPrice.toFixed(2);

  const handleSubscribe = async () => {
    setLoading(true);
    const stripe = await loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
    );
    if (!stripe) {
      return;
    }
    const response = await fetch("/api/checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        type: isAnnual ? "yearly" : "monthly",
      }),
    });
    const data = await response.json();
    await stripe.redirectToCheckout({
      sessionId: data.sessionId,
    });
    onSubscribe(isAnnual);
    onClose();
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Subscribe to {plan.name}</DialogTitle>
          <DialogDescription>
            You're about to subscribe to our {plan.name} plan.
          </DialogDescription>
        </DialogHeader>
        <div className='py-4'>
          <div className='flex justify-between items-center mb-4'>
            <span className='text-2xl font-bold'>
              ${price}/{isAnnual ? "year" : "month"}
            </span>
            <div className='flex items-center space-x-2'>
              <span>Monthly</span>
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
                aria-label='Toggle annual billing'
              />
              <span>Annual</span>
            </div>
          </div>
          <p className='text-sm text-gray-500 mb-4'>
            {isAnnual ? "Billed annually" : "Billed monthly"}
            {isAnnual && (
              <span className='text-green-600 ml-1'>
                (Save {annualDiscount * 100}%)
              </span>
            )}
          </p>
          <div className='space-y-2'>
            <p className='font-semibold'>Features included:</p>
            {plan.features.map((feature, index) => (
              <div key={index} className='flex items-start space-x-3'>
                <Check className='h-5 w-5 text-green-500 mt-0.5 flex-shrink-0' />
                <span className='text-sm'>{feature}</span>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubscribe} disabled={loading}>
            {loading ? <Spinner size='sm' /> : "Confirm Subscription"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
