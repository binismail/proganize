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
// You'll need to create this utility function

export default function Home() {
  const { dispatch, state } = useAppContext();
  const {
    user,
    hasGenerationStarted,
    isGenerating,
    isEditorVisible,
    showInitialContent,
    subscriptionStatus, // Add this to your app context
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

  return (
    <div className='flex flex-col'>
      <Nav />
      <main className='flex-grow flex'>
        <div className='flex w-full'>
          {/* Conversation sidebar */}
          <DocumentList />

          {/* Main content area */}
          <div className='w-full flex'>
            {/* Input area */}
            <div
              className={`flex flex-col ${isEditorVisible ? "mx-5" : "mx-auto"} ${isEditorVisible && "w-full"} min-w-[500px] max-w-[500px]`}
            >
              {hasGenerationStarted ? <Conversation /> : null}
              {showInitialContent ? (
                <div className='mb-10 my-auto'>
                  <h1 className='text-3xl font-bold text-center'>
                    What would you like to build?
                  </h1>
                  <p className='text-center text-gray-60 text-sm mt-2 mx-auto'>
                    I can help you easily get your ideas to a well detailed
                    document, and organize your product development process in
                    minutes. <b>Try me</b>
                  </p>
                </div>
              ) : null}

              <DocumentGenerator subscriptionStatus={subscriptionStatus} />
            </div>
            {/* Document editor */}
            {isEditorVisible && <Editor />}
          </div>
        </div>
      </main>
    </div>
  );
}
