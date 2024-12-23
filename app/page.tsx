"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "./context/appContext";
import { supabase } from "@/utils/supabase/instance";
import {
  checkAndInitializeUser,
  checkSubscriptionStatus,
} from "@/utils/supabaseOperations";
import { FileText, Book, PenTool, ChartBar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Nav from "@/components/layout/nav";

export default function Dashboard() {
  const { dispatch, state } = useAppContext();
  const { user } = state;
  const router = useRouter();

  useEffect(() => {
    async function fetchUserAndSubscription() {
      try {
        const { data } = await supabase.auth.getUser();
        if (data && data.user) {
          dispatch({ type: "SET_USER", payload: data.user });

          // Check and initialize word credits
          const { credits } = await checkAndInitializeUser(
            data.user.id,
            data.user
          );
          dispatch({ type: "SET_WORD_CREDITS", payload: credits });

          // Check subscription status
          const status = await checkSubscriptionStatus(data.user.id);
          dispatch({ type: "SET_SUBSCRIPTION_STATUS", payload: status });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    fetchUserAndSubscription();
  }, [dispatch]);

  const features = [
    {
      title: "Write & Create",
      description: "Create new documents and organize your writing",
      icon: PenTool,
      href: "/write",
      color: "text-blue-500",
    },
    {
      title: "PDF Analysis",
      description: "Analyze and chat with your PDF documents",
      icon: FileText,
      href: "/chat",
      color: "text-green-500",
    },
    {
      title: "Study Tools",
      description: "Generate flashcards and quizzes from your documents",
      icon: Book,
      href: "/study",
      color: "text-purple-500",
    },
    {
      title: "Analytics",
      description: "Track your writing progress and usage",
      icon: ChartBar,
      href: "/analytics",
      color: "text-orange-500",
    },
  ];

  return (
    <div className='flex h-screen overflow-hidden'>
      <Nav />
      <div className='flex-1 overflow-y-auto'>
        <main className='container mx-auto p-6 space-y-8'>
          <div>
            <h1 className='text-3xl font-bold'>
              Welcome{user ? `, ${user.email}` : ""}
            </h1>
            <p className='text-muted-foreground mt-2'>
              Choose a feature to get started with Proganize
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {features.map((feature) => (
              <Card
                key={feature.title}
                className='hover:shadow-lg transition-shadow cursor-pointer'
                onClick={() => router.push(feature.href)}
              >
                <CardHeader>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-muted-foreground'>{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Recent Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground'>
                  Your recent documents will appear here
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground'>
                  Your usage statistics will appear here
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
