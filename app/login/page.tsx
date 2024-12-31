"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/app/supabase-provider";
import GoogleSignup from "@/components/shared/googleSignup";
import Image from "next/image";
import proganizeLogo from "@/public/assets/Icon-prorganize.png";
import { Card } from "@/components/ui/card";
import { FileText, PenTool, MessageSquare } from "lucide-react";
import logoBlack from "@/asset/proganize-dark-side.svg";
import logoWhite from "@/asset/proganize-light-side.svg";

export default function LoginPage() {
  const router = useRouter();
  const { supabase } = useSupabase();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push("/"); // Redirect to dashboard if already logged in
      }
    };

    checkUser();
  }, [router, supabase.auth]);

  return (
    <div className='min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900'>
      {/* Left Section - Hero */}
      <div className='w-full md:w-1/2 flex flex-col justify-center p-8 md:p-16 bg-black'>
        <div className='space-y-6 text-white'>
          <div className='flex items-center gap-3'>
            <Image
              src={logoWhite}
              alt='Proganize Logo'
              className='rounded-lg'
            />
          </div>
          <h2 className='text-4xl md:text-5xl font-extrabold leading-normal'>
            Write, Organize and Chat with
            <br />
            Documents With AI Power
          </h2>
          <p className='text-lg text-gray-100 max-w-md'>
            Easily write documents 10X faster, chat with pdf, create study
            guides, flashcards and get 10x ahead of deadlines
          </p>

          {/* Feature List */}
          <div className='space-y-4 mt-8'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-white/10 rounded-lg'>
                <MessageSquare className='w-5 h-5' />
              </div>
              <span>Chat with pdf</span>
            </div>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-white/10 rounded-lg'>
                <PenTool className='w-5 h-5' />
              </div>
              <span>Create Study Guides</span>
            </div>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-white/10 rounded-lg'>
                <FileText className='w-5 h-5' />
              </div>
              <span>Write documents 10X faster</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Login */}
      <div className='w-full md:w-1/2 flex items-center justify-center p-8'>
        <Card className='w-full max-w-md p-8 space-y-8 shadow-lg dark:bg-gray-800/50 backdrop-blur'>
          <div className='text-center space-y-2'>
            <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
              Welcome Back
            </h2>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Sign in to continue organizing your content
            </p>
          </div>

          <div className='space-y-6 mx-auto'>
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-300 dark:border-gray-700' />
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400'>
                  Continue with
                </span>
              </div>
            </div>

            <GoogleSignup />
          </div>

          <p className='text-xs text-center text-gray-500 dark:text-gray-400'>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </Card>
      </div>
    </div>
  );
}
