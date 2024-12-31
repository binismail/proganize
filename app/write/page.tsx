"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "../context/appContext";
import DocumentList from "@/components/document/documentList";
import Editor from "@/components/editor/editor";
import { supabase } from "@/utils/supabase/instance";
import {
  checkAndInitializeUser,
  checkSubscriptionStatus,
  getToken,
  sFetchDocuments,
} from "@/utils/supabaseOperations";
import { PlusIcon, Sparkles, Search } from "lucide-react";
import { SubscribeModal } from "@/components/shared/subscribeModal";
import AnimatedSparklesComponent from "@/components/shared/animatedSpark";
import Nav from "@/components/layout/nav";
import { TemplateSelector } from "@/components/editor/templateSelector";
import { CreditDisplay } from "@/components/shared/creditDisplay";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Template } from "@/config/templates";

export default function WritePage() {
  const { dispatch, state } = useAppContext();
  const {
    isEditorVisible,
    showInitialContent,
    showUpgrade,
    openDocument,
    isLoading,
    user,
    wordCredits,
  } = state;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

          // Reset editor state
          dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: false });
          dispatch({ type: "SET_SHOW_INITIAL_CONTENT", payload: true });
          dispatch({ type: "SET_CURRENT_DOCUMENT_ID", payload: null });
          dispatch({ type: "SET_GENERATED_DOCUMENT", payload: "" });

          // Fetch documents
          await fetchDocuments(data.user.id);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    fetchUserAndSubscription();
  }, [dispatch]);

  const fetchDocuments = async (userId: string) => {
    try {
      const { data: ownedDocs, error } = await sFetchDocuments(userId);
      if (error) throw error;

      dispatch({ type: "SET_DOCUMENTS", payload: ownedDocs || [] });
      dispatch({ type: "SET_IS_LOADING", payload: false });
    } catch (error) {
      console.error("Error fetching documents:", error);
      dispatch({ type: "SET_IS_LOADING", payload: false });
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className='flex h-screen overflow-hidden bg-background'>
      <Nav />
      <main className='flex-1 overflow-y-auto'>
        <div className='container max-w-6xl py-6'>
          {/* Header with Credits */}
          <div className='flex items-center justify-between mb-8'>
            <h1 className='text-4xl font-bold'>What will you create?</h1>
            <CreditDisplay />
          </div>

          {/* Main Input */}
          <div className='relative mb-12'>
            <Input
              className='w-full h-14 pl-12 pr-32 text-lg bg-background border-2 border-primary/20 hover:border-primary/40 focus:border-primary rounded-xl'
              placeholder='Describe what you want to write...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className='absolute left-4 top-4 h-6 w-6 text-muted-foreground' />
            <Button
              className='absolute right-2 top-2'
              onClick={() => {
                if (searchQuery.trim()) {
                  dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: true });
                  // Handle generation here
                }
              }}
            >
              Generate
              <Sparkles className='ml-2 h-4 w-4' />
            </Button>
          </div>

          {/* Templates Grid */}
          <TemplateSelector
            onSelectTemplate={function (template: Template, values: any): void {
              throw new Error("Function not implemented.");
            }}
          />

          {/* Editor */}
          {isEditorVisible && (
            <div className='fixed inset-0 z-50 bg-background'>
              <Editor />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
