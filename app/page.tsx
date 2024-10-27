"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Nav from "@/components/layout/nav";
import ProrganizeLogo from "@/asset/Icon-prorganize.png";
import getUser from "./actions";
import autosize from "autosize";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { useAppContext } from "./context/appContext";
import DocumentList from "@/components/document/documentList";
import Editor from "@/components/editor/editor";
import Conversation from "@/components/shared/conversation";
import DocumentGenerator from "@/components/shared/documentGenerator";
import { supabase } from "@/utils/supabase/instance";
import { checkSubscriptionStatus } from "@/utils/supabaseOperations";
import { Dialog, DialogContent } from "@radix-ui/react-dialog";
import { Pencil, Eye, Feather, Gift, PlusIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import NewDocument from "@/components/shared/newDocument";
import { SubscribeModal } from "@/components/shared/subscribeModal";
import { useRouter } from "next/navigation";
import LightRichTextEditor from "@/components/editor/lightRichTextEditor";
import RichTextEditor from "@/components/editor/customEditor";
// You'll need to create this utility function

export default function Home() {
  const { dispatch, state } = useAppContext();
  const {
    user,
    hasGenerationStarted,
    isGenerating,
    isEditorVisible,
    showInitialContent,
    openDocument, // Add this to your app context
  } = state;

  // Add a new state variable to track if generation has ever started
  //const [hasGenerationStarted, setHasGenerationStarted] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function fetchUserAndSubscription() {
      try {
        const { data } = await supabase.auth.getUser();
        if (data && data.user) {
          dispatch({ type: "SET_USER", payload: data.user });
          dispatch({ type: "SET_HAS_GENERATION_STARTED", payload: false });
          dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: false });
          console.log(data.user);

          // Fetch subscription status
          const status = await checkSubscriptionStatus(data.user.id);
          dispatch({ type: "SET_SUBSCRIPTION_STATUS", payload: status });
        }
      } catch (err) {
        console.error(err);
      }
    }

    fetchUserAndSubscription();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      autosize(textareaRef.current);
    }
    return () => {
      if (textareaRef.current) {
        autosize.destroy(textareaRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

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
    <main className='flex-grow flex'>
      {/* <Nav /> */}
      <div className='flex w-full'>
        {/* Conversation sidebar */}
        <DocumentList />

        {showInitialContent && (
          <div className='flex items-center justify-center w-full flex-col'>
            <h1 className='text-3xl font-bold my-4'>
              Start your documentation
            </h1>
            <p className='mx-auto w-[500px] text-center mb-6 text-sm'>
              Easily get your ideas to a well detailed document, and organize
              your product development process in minutes.
            </p>
            <Button
              className='rounded-full'
              onClick={() =>
                dispatch({ type: "SET_OPEN_DOCUMENT", payload: true })
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

      {/* <SubscribeModal
        isOpen={true}
        onClose={() => false}
        onSubscribe={() => router.push("/subscribe")}
        plan={{
          name: "Pro",
          monthlyPrice: 20, // Adjust this to your actual price
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
        }}
        initialIsAnnual={false}
        annualDiscount={20}
      /> */}

      {openDocument && (
        <NewDocument
          openDocument={openDocument}
          onClose={() =>
            dispatch({ type: "SET_OPEN_DOCUMENT", payload: false })
          }
        />
      )}
    </main>
  );
}
