"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useSupabase } from "@/app/supabase-provider";
import { useAppContext } from "@/app/context/appContext";
import { WelcomePopup } from "./WelcomePopup";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function GoogleSignup() {
  const { supabase } = useSupabase();
  const { dispatch } = useAppContext();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "Auth state changed in GoogleSignup:",
        event,
        session?.user?.id
      );

      if (event === "SIGNED_IN" && session) {
        await handleNewSignIn(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error signing in:", error);
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: "There was a problem signing you in. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSignIn = async (session: any) => {
    try {
      console.log("Handling new sign in for session:", session);
      setIsLoading(true);
      const user = session.user;

      // Check if user has word credits
      const { data: existingCredits, error: creditsError } = await supabase
        .from("word_credits")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("Existing credits check:", existingCredits, creditsError);

      let isNewUser = false;

      if (
        !existingCredits &&
        (!creditsError || creditsError.code === "PGRST116")
      ) {
        console.log("Initializing new user...");
        isNewUser = true;

        // Initialize word credits using upsert to prevent race conditions
        const { error: initError } = await supabase.from("word_credits").upsert(
          {
            user_id: user.id,
            remaining_credits: 1000,
            total_words_generated: 0,
          },
          { onConflict: "user_id" }
        );

        if (initError) {
          console.error("Error initializing credits:", initError);
          throw initError;
        }

        // Log credit transaction
        const { error: transactionError } = await supabase
          .from("credit_transactions")
          .insert([
            {
              user_id: user.id,
              amount: 1000,
              type: "welcome_bonus",
              description: "Welcome bonus credits",
            },
          ]);

        if (transactionError) {
          console.error("Error creating transaction:", transactionError);
          // Don't throw here, as the credits are already created
        }

        console.log("Successfully initialized new user");
      }

      if (isNewUser) {
        console.log("Setting up new user welcome...");
        const displayName =
          user.user_metadata?.full_name || user.email?.split("@")[0];
        setUserName(displayName);
        setShowWelcomePopup(true);

        // Update app context with initial credits
        dispatch({
          type: "SET_WORD_CREDITS",
          payload: {
            remaining_credits: 1000,
            total_words_generated: 0,
          },
        });
      }

      // Update app context with user data
      dispatch({
        type: "SET_USER",
        payload: user,
      });

      // Redirect to dashboard
      router.push("/");
    } catch (error) {
      console.error("Error during sign in:", error);
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: "There was a problem signing you in. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant='outline'
        type='button'
        disabled={isLoading}
        onClick={handleSignIn}
        className='w-full'
      >
        {isLoading ? (
          "Loading..."
        ) : (
          <div className='flex items-center justify-center gap-2'>
            <svg viewBox='0 0 48 48' className='w-5 h-5'>
              <path
                fill='#FFC107'
                d='M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z'
              />
              <path
                fill='#FF3D00'
                d='m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z'
              />
              <path
                fill='#4CAF50'
                d='M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z'
              />
              <path
                fill='#1976D2'
                d='M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z'
              />
            </svg>
            Google
          </div>
        )}
      </Button>

      {showWelcomePopup && (
        <WelcomePopup
          userName={userName}
          onClose={() => setShowWelcomePopup(false)}
          isOpen={showWelcomePopup}
        />
      )}
    </>
  );
}
