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
import { PlusIcon, Sparkles } from "lucide-react";
import NewDocument from "@/components/shared/newDocument";
import { SubscribeModal } from "@/components/shared/subscribeModal";
import AnimatedSparklesComponent from "@/components/shared/animatedSpark";
import Nav from "@/components/layout/nav";
import { TemplateSelector } from "@/components/editor/templateSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditDisplay } from "@/components/shared/creditDisplay";
import WriteLanding from "./landing";

export default function WritePage() {
  const { dispatch, state } = useAppContext();
  const {
    isEditorVisible,
    showInitialContent,
    showUpgrade,
    openDocument,
    isLoading,
    user,
  } = state;

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

      // Fetch documents where the user is a collaborator
      const { data: collaborativeDocs, error: collabError } = await supabase
        .from("document_collaborators")
        .select("document_id")
        .eq("user_id", userId);

      if (collabError) throw collabError;

      let allDocs = ownedDocs || [];

      if (collaborativeDocs?.length) {
        const { data: collabDetails, error: detailsError } = await supabase
          .from("documents")
          .select("*")
          .in(
            "id",
            collaborativeDocs.map((doc) => doc.document_id)
          )
          .order("updated_at", { ascending: false });

        if (detailsError) throw detailsError;
        allDocs = [...allDocs, ...(collabDetails || [])];
      }

      dispatch({ type: "SET_DOCUMENTS", payload: allDocs });
      dispatch({ type: "SET_IS_LOADING", payload: false });
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleTemplateSelect = async (template: any, values: any) => {
    try {
      dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: true });
      dispatch({ type: "SET_IS_GENERATING", payload: true });
      dispatch({ type: "SET_SHOW_INITIAL_CONTENT", payload: false });

      const prompt = generatePromptFromTemplate(template, values);
      const token = await getToken();

      // Call your AI endpoint here to generate content
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          template: template.id,
          values,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate content");

      const data = await response.json();
      console.log("Generated content:", data.content);

      // Extract title and content
      const documentContent = extractDocumentContent(data.content);
      const title = extractTitle(data.content) || template.name;

      // Save the new document
      if (documentContent) {
        const newDocument = {
          user_id: user?.id,
          title: title,
          content: documentContent,
          conversation: [{ role: "system", content: data.content }],
        };

        const { data: savedDoc, error } = await supabase
          .from("documents")
          .insert(newDocument)
          .select();

        if (error) {
          console.error("Error saving document:", error);
        } else if (savedDoc && savedDoc.length > 0) {
          console.log("Document saved successfully:", savedDoc[0]);
          dispatch({ type: "SET_SELECTED_DOCUMENT", payload: savedDoc[0] });
          dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: false });
          dispatch({
            type: "SET_CURRENT_DOCUMENT_ID",
            payload: savedDoc[0].id,
          });
          await fetchDocuments(user?.id || "");
          dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: true });
        }

        // Update the editor with the generated content
        dispatch({ type: "SET_GENERATED_DOCUMENT", payload: documentContent });
      }

      dispatch({ type: "SET_IS_GENERATING", payload: false });
    } catch (error) {
      console.error("Error generating content:", error);
      dispatch({ type: "SET_IS_GENERATING", payload: false });
    }
  };

  const extractDocumentContent = (text: string): string | null => {
    const documentRegex =
      /### Generated Document([\s\S]*?)### End of Generated Document/;
    const match = text.match(documentRegex);
    return match ? match[1].trim() : text; // Return the full text if no markers found
  };

  const extractTitle = (text: string): string => {
    // Try to find a title in the format "### Document Title: ..." or "### Initial Title: ..."
    const titleRegex = /### (?:Document|Initial) Title:(.*?)(?=\n|$)/;
    const match = text.match(titleRegex);
    return match ? match[1].trim() : "";
  };

  const generatePromptFromTemplate = (template: any, values: any) => {
    // Create a prompt based on the template and user values
    switch (template.id) {
      case "linkedin-post":
        return `Write a compelling LinkedIn post about ${values.topic}. Key points to cover: ${values.keyPoints}. Tone: ${values.tone || "Professional"}`;
      case "tweet-thread":
        return `Create a Twitter thread about ${values.topic} in ${values.tweetCount || 5} tweets.`;
      case "blog-post":
        return `Write an SEO-optimized blog post titled "${values.title}" targeting these keywords: ${values.keywords}. Word count: ${values.wordCount || 1000} words.`;
      // Add more cases for other templates
      default:
        return `Generate content for ${template.title} with the following details: ${JSON.stringify(values)}`;
    }
  };

  if (!user) {
    return <WriteLanding />;
  }

  return (
    <div className='flex h-screen overflow-hidden'>
      <Nav />
      <div className='flex flex-1'>
        {/* Document List Sidebar */}
        <aside
          className={`border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ${
            isSidebarCollapsed ? "w-16" : "w-72"
          }`}
        >
          <div className='flex flex-col h-full'>
            <div className='p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between'>
              {!isSidebarCollapsed && (
                <h2 className='font-semibold'>Documents</h2>
              )}
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                {isSidebarCollapsed ? <PlusIcon /> : <PlusIcon />}
              </Button>
            </div>
            <div className='flex-1 overflow-y-auto'>
              <DocumentList />
            </div>
            {!isSidebarCollapsed && (
              <div className='p-4 border-t border-gray-200 dark:border-gray-800'>
                <CreditDisplay variant='full' />
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className='flex-1 overflow-y-auto'>
          {isLoading ? (
            <div className='flex items-center justify-center h-full'>
              <AnimatedSparklesComponent />
            </div>
          ) : (
            <div className='h-full'>
              {showInitialContent && !openDocument && !isEditorVisible ? (
                <div className='p-6 max-w-7xl mx-auto'>
                  <div className='text-center mb-8'>
                    <h1 className='text-3xl font-bold'>Start Writing</h1>
                    <p className='text-muted-foreground mt-2'>
                      Choose a template or start from scratch
                    </p>
                    <div className='mt-4'>
                      <CreditDisplay variant='compact' />
                    </div>
                  </div>

                  <Tabs defaultValue='templates' className='w-full'>
                    <TabsList className='grid w-full grid-cols-2'>
                      <TabsTrigger value='templates'>
                        <Sparkles className='mr-2 h-4 w-4' />
                        AI Templates
                      </TabsTrigger>
                      <TabsTrigger value='blank'>
                        <PlusIcon className='mr-2 h-4 w-4' />
                        Blank Document
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value='templates' className='mt-4'>
                      <TemplateSelector
                        onSelectTemplate={handleTemplateSelect}
                      />
                    </TabsContent>
                    <TabsContent value='blank' className='mt-4'>
                      <div className='flex flex-col items-center justify-center space-y-4'>
                        <p className='text-muted-foreground'>
                          Start with a blank document and let your ideas flow
                        </p>
                        <Button
                          size='lg'
                          onClick={() =>
                            dispatch({
                              type: "SET_IS_EDITOR_VISIBLE",
                              payload: true,
                            })
                          }
                        >
                          <PlusIcon className='mr-2 h-4 w-4' />
                          New Document
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <Editor />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showUpgrade && (
        <SubscribeModal
          isOpen={false}
          onClose={function (): void {
            throw new Error("Function not implemented.");
          }}
          onSubscribe={function (isAnnual: boolean): void {
            throw new Error("Function not implemented.");
          }}
          plan={{
            name: "",
            monthlyPrice: 0,
            features: [],
          }}
          initialIsAnnual={false}
          annualDiscount={0}
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
  );
}
