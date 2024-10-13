import { useRef, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useAppContext } from "@/app/context/appContext";
import autosize from "autosize";
import { supabase } from "@/utils/supabase/instance";
import { Spinner } from "./spinner";
import { checkAndUpdateConversationCount } from "@/utils/supabaseOperations";
import Link from "next/link";

// Update the type definition for conversation

export default function DocumentGenerator({
  subscriptionStatus,
}: {
  subscriptionStatus: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { state, dispatch } = useAppContext();
  const {
    productIdea,
    isGenerating,
    conversation,
    selectedDocument,
    user,
    generatedDocument,
  } = state;

  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [nextResetTime, setNextResetTime] = useState<Date | null>(null);

  const handleGenerateDocument = async () => {
    dispatch({ type: "SET_IS_GENERATING", payload: true });

    if (subscriptionStatus !== "active") {
      const { canProceed, resetTime } = await checkAndUpdateConversationCount(
        user.id
      );
      if (!canProceed) {
        setDailyLimitReached(true);
        dispatch({ type: "SET_IS_GENERATING", payload: false });
        setNextResetTime(resetTime);
        return;
      }
    }

    dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: true });
    dispatch({ type: "SET_SHOW_INITIAL_CONTENT", payload: false });

    const userInput = { role: "user", content: productIdea };
    const updatedConversation = [...conversation, userInput];
    dispatch({ type: "SET_CONVERSATION", payload: updatedConversation });

    // Clear the input field
    dispatch({ type: "SET_PRODUCT_IDEA", payload: "" });

    // Simulate API call and typing effect
    const { reply } = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ conversation: updatedConversation }),
    }).then((res) => res.json());

    // Extract the document content
    const documentContent = extractDocumentContent(reply);

    // Remove the document content from the reply
    const cleanedReply = reply.replace(documentContent, "").trim();

    const aiResponse = { role: "system", content: cleanedReply };

    const finalConversation = [...updatedConversation, aiResponse];
    dispatch({ type: "SET_CONVERSATION", payload: finalConversation });

    dispatch({ type: "SET_IS_GENERATING", payload: false });

    // Save the extracted document content
    if (documentContent) {
      dispatch({
        type: "SET_GENERATED_DOCUMENT",
        payload: documentContent,
      });
    }

    if (!selectedDocument) {
      await saveNewDocument(
        finalConversation as { role: string; content: string }[],
        documentContent || ""
      );
    } else {
      await updateDocument(
        finalConversation as { role: string; content: string }[],
        documentContent || ""
      );
    }

    dispatch({ type: "SET_DOCUMENT_UPDATED", payload: true });
  };

  // Helper function to extract document content
  const extractDocumentContent = (text: string): string => {
    const documentRegex = /^### [\s\S]*$/m;
    const match = text.match(documentRegex);
    return match ? match[0] : "";
  };

  const saveNewDocument = async (
    finalConversation: { role: string; content: string }[],
    content: string
  ) => {
    if (!user || !user.id) {
      console.error("User not authenticated");
      return;
    }

    const newDocument = {
      user_id: user.id,
      title: productIdea,
      content: content,
      conversation: finalConversation,
    };

    const { data, error } = await supabase
      .from("documents")
      .insert(newDocument)
      .select();

    if (error) {
      console.error("Error saving document:", error);
    } else if (data && data.length > 0) {
      console.log("Document saved successfully:", data[0]);
      dispatch({ type: "SET_SELECTED_DOCUMENT", payload: data[0] });
      // setSelectedDocument(data[0]);
      await fetchDocuments();
    } else {
      console.error("No data returned when saving document");
    }
  };

  const updateDocument = async (
    finalConversation: { role: string; content: string }[],
    content: string
  ) => {
    if (!selectedDocument) {
      console.error("No document selected for update");
      return;
    }
    const { data, error } = await supabase
      .from("documents")
      .update({
        content: content,
        conversation: finalConversation,
      })
      .eq("id", selectedDocument.id)
      .select();

    if (error) {
      console.error("Error updating document:", error);
    } else if (data && data.length > 0) {
      console.log("Document updated successfully:", data[0]);
      dispatch({ type: "SET_SELECTED_DOCUMENT", payload: data[0] });
      await fetchDocuments();
    } else {
      console.error("No data returned when updating document");
    }
  };

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
    <div>
      {dailyLimitReached ? (
        <div className='mb-4 bg-blue-200 border border-blue-300 rounded-lg p-2 text-sm text-blue-900 ml-2 px-auto'>
          You've reached your daily conversation limit. Please try again after{" "}
          {nextResetTime?.toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          <Link href='/billing' className='underline ml-2'>
            Upgrade to access Unlimited conversation
          </Link>
        </div>
      ) : null}
      <Textarea
        id='productIdea'
        ref={textareaRef}
        className='rounded-full min-h-10 pt-3 pl-4 outline-none w-full'
        placeholder='What would you like to build?'
        value={productIdea}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleGenerateDocument();
          }
        }}
        onChange={(e) => {
          dispatch({
            type: "SET_PRODUCT_IDEA",
            payload: e.target.value,
          });
          // setProductIdea(e.target.value);
          if (textareaRef.current) {
            autosize.update(textareaRef.current);
          }
        }}
        disabled={dailyLimitReached}
      />
      <Button
        className='rounded-full mt-2 w-full mb-10'
        onClick={handleGenerateDocument}
        disabled={!productIdea.trim() || isGenerating || dailyLimitReached}
      >
        {isGenerating ? <Spinner /> : "Send"}
      </Button>
    </div>
  );
}
