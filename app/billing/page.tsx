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
import { CreditCard, Download, AlertTriangle } from "lucide-react";
import { Check } from "lucide-react"; // Make sure to import the Check icon
import { Switch } from "@/components/ui/switch";
import { SubscribeModal } from "@/components/shared/subscribeModal";
import Confetti from "react-confetti";

import Nav from "@/components/layout/nav";
import { supabase } from "@/utils/supabase/instance";
import { Spinner } from "@/components/shared/spinner";
import { useRouter, useSearchParams } from "next/navigation";
import { DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Dialog, DialogDescription, DialogTitle } from "@radix-ui/react-dialog";

export default function BillingPage() {
  const { state, dispatch } = useAppContext();
  const { subscription, paymentMethods, invoices, user } = state;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnnual, setIsAnnual] = useState(false);
  const annualDiscount = 0.2; // 20% discount for annual billing

  const premiumPlan = {
    name: "Pro",
    monthlyPrice: 20,
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

      // Fetch payment methods
      const { data: paymentMethodsData, error: paymentMethodsError } =
        await supabase
          .from("payment_methods")
          .select("*")
          .eq("user_id", userId);
      if (paymentMethodsError) throw paymentMethodsError;
      dispatch({
        type: "SET_PAYMENT_METHODS",
        payload: paymentMethodsData || [],
      });

      // Fetch invoices
      const { data: invoicesData, error: invoicesError } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (invoicesError) throw invoicesError;
      dispatch({ type: "SET_INVOICES", payload: invoicesData || [] });
    } catch (error: any) {
      console.error("Error fetching billing data:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
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
        setShowConfetti(true);
        setShowModal(true);
      }

      // Clear the session_id from the URL
      router.replace("/billing");
    } catch (error) {
      alert("There was an error processing your payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
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
    // Implement your subscription logic here
    console.log("Subscription confirmed");
    setIsSubscribeModalOpen(false);
  };

  return (
    <>
      {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
      {showModal && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Welcome to Pro!</DialogTitle>
              <DialogDescription>
                Start enjoying your pro features now. We're excited to have you
                on board!
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
      <Nav />
      <div className='container mx-auto px-4 py-8'>
        <h1 className='text-3xl font-bold mb-8'>Billing</h1>
        {isLoading ? (
          <Spinner size='lg' className='mx-auto' />
        ) : error ? (
          <div>Error loading billing data: {error}</div>
        ) : (
          <div className='space-y-4'>
            <Card>
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
                      <span className='font-medium'>{subscription?.plan}</span>
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
                        Your subscription will cancel at the end of the current
                        billing period.
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
                      <Button variant='destructive'>Cancel Subscription</Button>
                    )}
                  </>
                )}
              </CardFooter>
            </Card>

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

            <SubscribeModal
              isOpen={isSubscribeModalOpen}
              onClose={() => setIsSubscribeModalOpen(false)}
              onSubscribe={handleConfirmSubscription}
              plan={premiumPlan}
              isAnnual={isAnnual}
              annualDiscount={annualDiscount}
            />
            {isProcessing && <div>Processing your subscription...</div>}
          </div>
        )}
      </div>
    </>
  );
}
