"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Check } from "lucide-react";
import Nav from "@/components/layout/nav";
import Footer from "@/components/layout/footer";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const annualDiscount = 0.2; // 20% discount for annual billing

  const pricingPlans = [
    {
      name: "Free",
      monthlyPrice: 0,
      features: [
        "Create unlimited documents",
        "Chat with document: Limited to 10 conversations per day",
        "Collaborators: Invite up to 3 people to collaborate on a document",
      ],
      cta: "Get started for free",
    },
    {
      name: "Pro",
      monthlyPrice: 20,
      features: [
        "Everything in Free, plus:",
        "Share documents publicly with a direct link",
        "Unlimited collaborators: Collaborate with as many people as needed",
        "Unlimited conversations: Chat with your document without limits",
        "Download documents in PDF and DOCX formats",
        "Generate add-ons: Automatically create user stories, technical requirement documents, and product roadmaps",
        "Doc upload: Upload documents for AI-powered enhancement or to provide better context",
        "Priority support: Get quicker responses from our team",
        "Early access: Be the first to try new features",
      ],
      cta: "Upgrade to Pro",
    },
  ];

  const handleCheckout = (planName: string) => {
    console.log(`Checkout for ${planName} selected`);
  };

  return (
    <div className='bg-gray-100 min-h-screen'>
      <Nav />

      <main className='container mx-auto py-16 px-4'>
        <h1 className='text-4xl font-bold text-center mb-4'>Pricing</h1>
        <p className='text-xl text-center text-gray-600 mb-8'>
          No-nonsense pricing that doesn't suck
        </p>

        <div className='flex justify-center items-center space-x-4 mb-12'>
          <span className={`text-lg ${!isAnnual ? "font-bold" : ""}`}>
            Monthly
          </span>
          <Switch
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
            aria-label='Toggle annual billing'
          />
          <span className={`text-lg ${isAnnual ? "font-bold" : ""}`}>
            Annual <span className='text-green-600'>(Save 20%)</span>
          </span>
        </div>

        <div className='grid md:grid-cols-2 gap-8 max-w-4xl mx-auto'>
          {pricingPlans.map((plan, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className='text-3xl font-bold'>
                  $
                  {isAnnual
                    ? (plan.monthlyPrice * 12 * (1 - annualDiscount)).toFixed(2)
                    : plan.monthlyPrice.toFixed(2)}
                  {plan.monthlyPrice > 0 && (
                    <span className='text-lg font-normal'>
                      /{isAnnual ? "year" : "month"}
                    </span>
                  )}
                </CardTitle>
                <p className='text-xl'>{plan.name}</p>
                <p className='text-gray-500'>
                  {index === 0
                    ? "Perfect for getting started"
                    : "For power users"}
                </p>
              </CardHeader>
              <CardContent className='space-y-4'>
                {plan.features.map((feature, featureIndex) => (
                  <Feature key={featureIndex}>{feature}</Feature>
                ))}
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleCheckout(plan.name)} className='w-full'>{plan.cta}</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex items-center space-x-2'>
      <Check className='text-green-500 flex-shrink-0 text-sm' />
      <span className='text-sm'>{children}</span>
    </div>
  );
}
