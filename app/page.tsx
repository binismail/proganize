"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "./context/appContext";
import DocumentList from "@/components/document/documentList";
import Editor from "@/components/editor/editor";
import { supabase } from "@/utils/supabase/instance";
import {
  checkAndInitializeUser,
  checkSubscriptionStatus,
} from "@/utils/supabaseOperations";
import { Pencil, Eye, Feather, Gift, PlusIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import NewDocument from "@/components/shared/newDocument";
import { SubscribeModal } from "@/components/shared/subscribeModal";
import { useRouter } from "next/navigation";
import { TopUpModal } from "@/components/shared/topUpModal";
import AnimatedSparklesComponent from "@/components/shared/animatedSpark";
import GoogleSignInPopup from "@/components/shared/googleSignup";
import Nav from "@/components/layout/nav";

export default function Home() {
  const { dispatch, state } = useAppContext();
  const {
    user,
    isGenerating,
    isEditorVisible,
    showInitialContent,
    showUpgrade,
    openDocument,
    isLoading,
    activeTab,
    showTopup,
  } = state;

  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  useEffect(() => {
    async function fetchUserAndSubscription() {
      dispatch({ type: "SET_SHOW_INITIAL_CONTENT", payload: true });
      dispatch({ type: "SET_DOCUMENTS", payload: [] });
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
          dispatch({ type: "SET_HAS_GENERATION_STARTED", payload: false });
          dispatch({ type: "SET_HAS_GENERATION_STARTED", payload: false });
          dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: false });
          console.log(data.user);

          // Fetch subscription status
          const status = await checkSubscriptionStatus(data.user.id);
          dispatch({ type: "SET_SUBSCRIPTION_STATUS", payload: status });
        } else {
          setShowWelcomePopup(true); // Show welcome popup if no user
        }
      } catch (err) {
        console.error(err);
      } finally {
        dispatch({ type: "SET_IS_LOADING", payload: false }); // Stop loading
      }
    }

    dispatch({ type: "SET_IS_LOADING", payload: true }); // Start loading
    fetchUserAndSubscription();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  useEffect(() => {
    // Set active tab to writer when on home page
    dispatch({ type: "SET_ACTIVE_TAB", payload: "writer" });
  }, []);

  const premiumPlan = {
    name: "Pro",
    monthlyPrice: 14.99, // Adjust this to your actual price
    features: [
      "10,000 AI words per month",
      "Publish document to web",
      "Add collaborators to documents",
      "Export documents in PDF and DOCX formats",
      "Document upload (for reference or chat)",
      "Priority support",
      "Early access to new features",
    ],
  };

  const annualDiscount = 0.2;

  useEffect(() => {
    if (isGenerating) {
      dispatch({ type: "SET_HAS_GENERATION_STARTED", payload: true });
    }
  }, [isGenerating]);

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      // Fetch documents where the user is the owner
      const { data: ownedDocs, error: ownedError } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ownedError) throw ownedError;

      // Fetch documents where the user is a collaborator
      const { data: collaborativeDocs, error: collabError } = await supabase
        .from("document_collaborators")
        .select("document_id")
        .eq("user_id", user.id);

      if (collabError) throw collabError;

      // If there are collaborative documents, fetch their details
      let collabDocsDetails = [];
      if (collaborativeDocs && collaborativeDocs.length > 0) {
        const { data: collabDetails, error: detailsError } = await supabase
          .from("documents")
          .select("*")
          .in(
            "id",
            collaborativeDocs.map((doc) => doc.document_id)
          )
          .order("created_at", { ascending: false });

        if (detailsError) throw detailsError;
        collabDocsDetails = collabDetails || [];
      }

      // Combine and deduplicate the results
      const allDocs = [...(ownedDocs || []), ...collabDocsDetails];
      const uniqueDocs = Array.from(new Set(allDocs.map((doc) => doc.id))).map(
        (id) => allDocs.find((doc) => doc.id === id)
      );

      dispatch({ type: "SET_DOCUMENTS", payload: uniqueDocs });
      dispatch({ type: "SET_IS_LOADING", payload: false });
    } catch (error) {
      console.error("Error fetching documents:", error);
      dispatch({ type: "SET_IS_LOADING", payload: false });
    }
  };

  const router = useRouter();

  const templates = [
    { icon: Pencil, title: "Define your tech stack and specs with ease." },
    { icon: Feather, title: "Capture user needs in actionable stories." },
    { icon: Gift, title: "Write SEO-optimized posts that drive traffic." },
    { icon: Eye, title: "Generate clear, professional README." },
  ];

  return (
    <div>
      <Nav />
      <div>
        {isLoading && (
          <div className='flex justify-center items-center h-screen w-screen'>
            <AnimatedSparklesComponent />
          </div>
        )}

        {!isLoading && (
          <div className='flex w-full'>
            {/* Conversation sidebar */}
            <DocumentList />

            {showUpgrade && (
              <SubscribeModal
                isOpen={showUpgrade}
                onClose={() => {
                  dispatch({ type: "SET_SHOW_UPGRADE_MODAL", payload: false });
                }}
                onSubscribe={() => router.push("/subscribe")}
                plan={premiumPlan}
                initialIsAnnual={false}
                annualDiscount={annualDiscount}
              />
            )}

            {showTopup && (
              <TopUpModal
                isOpen={showTopup}
                onClose={() =>
                  dispatch({ type: "SET_SHOW_TOPUP_MODAL", payload: false })
                }
                userId={user?.id}
              />
            )}

            {showInitialContent && activeTab === "write" && (
              <div className='flex items-center justify-center w-full flex-col'>
                <h1 className='text-3xl font-bold my-4'>
                  Start your documentation
                </h1>
                <p className='mx-auto w-[500px] text-center mb-6 text-sm'>
                  Easily get your ideas to a well detailed document, and
                  organize your product development process in minutes.
                </p>
                <Button
                  className='rounded-full'
                  onClick={() =>
                    !user
                      ? setShowWelcomePopup(true)
                      : dispatch({ type: "SET_OPEN_DOCUMENT", payload: true })
                  }
                >
                  New Document
                  <PlusIcon size={15} className='ml-2' />
                </Button>

                <div className='flex gap-6 mt-10'>
                  {templates.map((template, index) => (
                    <Card
                      key={index}
                      className='hover:shadow-lg transition-shadow duration-300 rounded-2xl w-[200px] py-2 cursor-pointer'
                    >
                      <CardContent className='flex flex-col items-center justify-center p-6'>
                        <template.icon className='mb-4 text-primary' />
                        <p className='text-center text-sm'>{template.title}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {isEditorVisible && <Editor />}
          </div>
        )}

        {showWelcomePopup && (
          <GoogleSignInPopup
            isOpen={showWelcomePopup}
            onClose={() => setShowWelcomePopup(false)}
          />
        )}

        {openDocument && (
          <NewDocument
            openDocument={openDocument}
            onClose={() =>
              dispatch({ type: "SET_OPEN_DOCUMENT", payload: false })
            }
          />
        )}
      </div>
    </div>
  );
}
