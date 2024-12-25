"use client";
import { useState, useEffect } from "react";
import { useAppContext } from "../context/appContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  AlertTriangle,
  ChevronLeft,
  Wallet,
  AlertCircle,
} from "lucide-react";
import { Check } from "lucide-react"; // Make sure to import the Check icon
import { SubscribeModal } from "@/components/shared/subscribeModal";
import Confetti from "react-confetti";

import { supabase } from "@/utils/supabase/instance";
import { Spinner } from "@/components/shared/spinner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import { Dialog, DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { Suspense } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

import { checkWordCredits } from "@/lib/wordCredit";
import { TopUpModal } from "@/components/shared/topUpModal";
import { CancelSubscriptionModal } from "@/components/shared/CancelSubscriptionModal";
import { toast } from "@/hooks/use-toast";
import sendEventToMixpanel from "@/lib/sendEventToMixpanel";
import { PromotionCard } from "@/components/dashboard/PromotionCard";

function BillingPageContent() {
  const { state, dispatch } = useAppContext();
  const { subscription, invoices, user, showTopup } = state;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnnual] = useState(false);
  const annualDiscount = 0.2; // 20% discount for annual billing

  const premiumPlan = {
    name: "Pro",
    monthlyPrice: 14.99,
    features: [
      "Share documents publicly with a direct link",
      "Unlimited collaborators",
      "Unlimited conversations with your documents",
      "Download documents in PDF and DOCX formats",
      "Generate add-ons (user stories, technical requirements, product roadmaps)",
      "Upload documents for AI-powered enhancement",
      "Priority support",
      "Early access to new features",
    ],
  };

  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [wordCredits, setWordCredits] = useState<number>(0);
  const MAX_CREDITS = 10000; // Define maximum credits threshold
  const LOW_CREDITS_THRESHOLD = 1000;
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Holiday promotions
  const HOLIDAY_PROMOTIONS = [
    {
      title: "Holiday Special",
      description: "Get 50% extra credits this holiday season! ",
      price: 10,
      baseCredits: 5000,
      bonusCredits: 2500,
      isHolidayOffer: true,
    },
    {
      title: "New Year Bundle",
      description: "Start 2024 with double credits! ",
      price: 20,
      baseCredits: 10000,
      bonusCredits: 10000,
      isHolidayOffer: true,
    },
  ];

  // Regular packages
  const REGULAR_PACKAGES = [
    {
      title: "Starter Pack",
      description: "Perfect for small projects",
      price: 10,
      baseCredits: 5000,
    },
    {
      title: "Pro Pack",
      description: "Most popular choice for professionals",
      price: 25,
      baseCredits: 15000,
      isSpecialOffer: true,
    },
  ];

  const isHolidayPromoActive = true;

  useEffect(() => {
    const initializePage = async () => {
      if (!user) {
        try {
          const { data } = await supabase.auth.getUser();
          if (data && data.user) {
            dispatch({ type: "SET_USER", payload: data.user });
            await fetchBillingData(data.user.id);
          } else {
            // Handle case where user data couldn't be fetched
            setError("Unable to fetch user data. Please try logging in again.");
            return;
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          setError("An error occurred while fetching user data.");
          return;
        }
      } else {
        await fetchBillingData(user.id);
      }

      const sessionId = searchParams.get("session_id");
      if (sessionId) {
        await handleSuccessfulPayment(sessionId);
      }
    };

    initializePage();
  }, [searchParams]);

  const fetchBillingData = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch subscription data
      const { data: subscriptionData, error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

      if (subscriptionError && subscriptionError.code !== "PGRST116") {
        throw subscriptionError;
      }
      dispatch({ type: "SET_SUBSCRIPTION", payload: subscriptionData || null });

      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (invoicesError) throw invoicesError;
      dispatch({ type: "SET_INVOICES", payload: invoicesData || [] });

      // Get word credits using our existing function
      const remainingCredits = await checkWordCredits(userId);
      setWordCredits(remainingCredits);
    } catch (error: any) {
      console.error("Error fetching billing data:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelSubscription = async () => {
    setIsProcessing(true);

    try {
      const response = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subId: subscription.subscription_id }),
      });

      const data = await response.json();

      if (data) {
        const { error } = await supabase
          .from("subscriptions")
          .delete()
          .eq("subscription_id", subscription.subscription_id);

        if (error) {
          throw error;
        }
      }

      dispatch({ type: "SET_SUBSCRIPTION", payload: null });
      toast({ description: "Subscription cancelled successfully." });
    } catch (error) {
      toast({
        description:
          "There was an error processing your payment. Please try again.",
      });
    }
  };

  const handleSuccessfulPayment = async (sessionId: string) => {
    setIsProcessing(true);

    try {
      // Verify the session and get details from your backend
      const response = await fetch("/api/verify-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (data) {
        setPaymentData(data);
        setShowConfetti(true);
        setShowModal(true);
        if (data.metadata?.creditAmount) {
          const creditAmountStr = data?.metadata?.creditAmount;
          const creditAmount = creditAmountStr
            ? parseInt(creditAmountStr, 10)
            : 0;
          const amountPaid = creditAmount * 0.002;
          sendEventToMixpanel("topup", user, { amount: amountPaid });
        }
      }

      // Clear the session_id from the URL
      router.replace("/billing");
    } catch (error) {
      alert("There was an error processing your payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (subscription) {
      await cancelSubscription();
      setIsCancelModalOpen(false);
    }
  };

  const formatAmount = (amount: number) => {
    return (amount / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  const handleSubscribe = () => {
    setIsSubscribeModalOpen(true);
  };

  const handleConfirmSubscription = () => {
    setIsSubscribeModalOpen(false);
  };

  const getProgressValue = () => (wordCredits / MAX_CREDITS) * 100;
  const getProgressColor = () => {
    const percentage = getProgressValue();
    if (percentage <= 20) return "bg-red-500";
    if (percentage <= 40) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <>
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
      {showModal && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                {paymentData?.metadata?.creditAmount ? (
                  <>
                    <Wallet className='h-5 w-5 text-green-500' />
                    Credits Added Successfully!
                  </>
                ) : (
                  <>
                    <Check className='h-5 w-5 text-green-500' />
                    Welcome to Pro!
                  </>
                )}
              </DialogTitle>
              <DialogDescription className='pt-2 space-y-2'>
                {paymentData?.metadata?.creditAmount ? (
                  <>
                    <p>
                      <span className='font-medium text-green-600'>
                        {parseInt(
                          paymentData.metadata.creditAmount
                        ).toLocaleString()}
                      </span>{" "}
                      word credits have been added to your account.
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      Your new balance will be reflected in your dashboard
                      immediately.
                    </p>
                  </>
                ) : (
                  <>
                    <p>Your subscription has been activated successfully!</p>
                    <p className='text-sm text-muted-foreground'>
                      Start enjoying your pro features now. We're excited to
                      have you on board!
                    </p>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className='mt-4'>
              <Button onClick={() => setShowModal(false)} className='w-full'>
                Got it, thanks!
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* <Nav /> */}
      <div className='container mx-auto px-4 py-8'>
        <div className='flex items-center gap-4 mb-8'>
          <div className='cursor-pointer' onClick={() => router.push("/")}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <ChevronLeft className='mt-2' />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Return Home</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <h1 className='text-3xl font-bold'>Billing</h1>
        </div>
        {isLoading ? (
          <Spinner size='lg' className='mx-auto' />
        ) : error ? (
          <div>Error loading billing data: {error}</div>
        ) : (
          <div className='space-y-4'>
            <div className='flex w-full gap-8'>
              <Card className='md:w-1/2'>
                <CardHeader>
                  <CardTitle>Subscription</CardTitle>
                  <CardDescription>
                    Manage your subscription and billing cycle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {subscription ? (
                    <div className='space-y-2'>
                      <div className='flex justify-between'>
                        <span>Current Plan:</span>
                        <span className='font-medium'>
                          {subscription?.plan}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span>Status:</span>
                        <Badge
                          variant={
                            subscription.status === "active"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {subscription.status.charAt(0).toUpperCase() +
                            subscription.status.slice(1)}
                        </Badge>
                      </div>
                      <div className='flex justify-between'>
                        <span>Next Billing Date:</span>
                        <span className='font-medium'>
                          {new Date(
                            subscription.current_period_end
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      {subscription.cancel_at_period_end && (
                        <div className='flex items-center text-yellow-600'>
                          <AlertTriangle className='mr-2 h-4 w-4' />
                          Your subscription will cancel at the end of the
                          current billing period.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className='text-center'>
                      <h3 className='text-lg font-semibold mb-4'>
                        You're not subscribed yet
                      </h3>
                      <p className='text-sm text-gray-500 mb-4'>
                        Subscribe now to unlock premium features:
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className='flex justify-between'>
                  {!subscription ? (
                    <Button onClick={handleSubscribe} className='w-full'>
                      Subscribe Now
                    </Button>
                  ) : (
                    <>
                      <Button variant='outline'>Change Plan</Button>
                      {subscription.cancel_at_period_end ? (
                        <Button variant='default'>Resume Subscription</Button>
                      ) : (
                        <Button
                          variant='destructive'
                          onClick={() => setIsCancelModalOpen(true)}
                        >
                          Cancel Subscription
                        </Button>
                      )}
                    </>
                  )}
                </CardFooter>
              </Card>

              <Card className='md:w-1/2'>
                <CardHeader>
                  <div className='flex items-center gap-2'>
                    <Wallet className='h-5 w-5' />
                    <CardTitle>Word Credits Balance</CardTitle>
                  </div>
                  <CardDescription>
                    Monitor your word credits and top up when needed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex justify-between items-center'>
                      <span>Available Credits:</span>
                      <div className='flex items-center gap-2'>
                        <span className='text-2xl font-bold'>
                          {wordCredits.toLocaleString()}
                        </span>
                        <span className='text-sm text-gray-500'>words</span>
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Progress
                        value={getProgressValue()}
                        className={`h-2 ${getProgressColor()}`}
                      />
                      <div className='flex justify-between text-sm text-gray-500'>
                        <span>Max words</span>
                        <span>{MAX_CREDITS.toLocaleString()} words</span>
                      </div>
                    </div>

                    {wordCredits < LOW_CREDITS_THRESHOLD && (
                      <div className='flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-md'>
                        <AlertCircle className='h-4 w-4' />
                        <span className='text-sm'>
                          Your word credits are running low. Consider topping up
                          to ensure uninterrupted service.
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className='flex justify-end gap-4'>
                  <Button
                    onClick={() =>
                      dispatch({ type: "SET_SHOW_TOPUP_MODAL", payload: true })
                    }
                    className='w-full'
                    variant={
                      wordCredits < LOW_CREDITS_THRESHOLD
                        ? "default"
                        : "outline"
                    }
                  >
                    Top Up Credits
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>View your recent invoices</CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice Number</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice: any) => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.id.split("-")[1]}</TableCell>
                          <TableCell>
                            {new Date(invoice.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {formatAmount(invoice.amount_paid)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                invoice.status === "paid"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {invoice.status.charAt(0).toUpperCase() +
                                invoice.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className='text-right'>
                            <Button variant='ghost' size='sm' asChild>
                              <a
                                href={invoice.invoice_pdf}
                                target='_blank'
                                rel='noopener noreferrer'
                              >
                                <Download className='h-4 w-4 mr-2' />
                                Download
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className='text-center text-gray-500 mb-10'>
                    No billing history available yet.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Holiday Promotions */}
            {isHolidayPromoActive && (
              <div className='space-y-4 mt-8'>
                <div className='flex items-center gap-2'>
                  <h2 className='text-2xl font-bold'>Holiday Specials</h2>
                  <Badge variant='destructive'>Limited Time</Badge>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {HOLIDAY_PROMOTIONS.map((promo, index) => (
                    <PromotionCard key={index} {...promo} />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Packages */}
            <div className='space-y-4 mt-8'>
              <h2 className='text-2xl font-bold'>Credit Packages</h2>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {REGULAR_PACKAGES.map((pack, index) => (
                  <PromotionCard key={index} {...pack} />
                ))}
              </div>
            </div>

            <SubscribeModal
              isOpen={isSubscribeModalOpen}
              onClose={() => setIsSubscribeModalOpen(false)}
              onSubscribe={handleConfirmSubscription}
              plan={premiumPlan}
              initialIsAnnual={isAnnual}
              annualDiscount={annualDiscount}
            />
            <CancelSubscriptionModal
              isOpen={isCancelModalOpen}
              onClose={() => setIsCancelModalOpen(false)}
              onCancel={handleCancelSubscription}
            />
            {isProcessing && <div>Processing your subscription...</div>}
          </div>
        )}
      </div>

      <TopUpModal
        isOpen={showTopup}
        onClose={() =>
          dispatch({ type: "SET_SHOW_TOPUP_MODAL", payload: false })
        }
        userId={user?.id}
      />
    </>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<Spinner size='lg' className='mx-auto' />}>
      <BillingPageContent />
    </Suspense>
  );
}
