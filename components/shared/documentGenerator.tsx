"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { useAppContext } from "@/app/context/appContext";
import { supabase } from "@/utils/supabase/instance";
import { ArrowUp, FileUp, X } from "lucide-react";
import { checkWordCredits, deductWordCredits } from "@/lib/wordCredit";
import AnimatedSparklesComponent from "./animatedSpark";

export default function DocumentGenerator({
  placeholderText = "Ask me anything related to your document",
  template,
  documentType,
}: {
  subscriptionStatus: string;
  placeholderText: string;
  template?: string;
  documentType?: string;
}) {
  const { state, dispatch } = useAppContext();
  const {
    productIdea,
    isGenerating,
    conversation,
    selectedDocument,
    user,
    wordCredits,
  } = state;
  const [documentInfo, setDocumentInfo] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; extension: string }[]
  >([]); // New state for uploaded file names and extensions
  const [insufficientCredits, setInsufficientCredits] = useState(false);

  const handleGenerateDocument = async () => {
    try {
      dispatch({ type: "SET_IS_GENERATING", payload: true });
      dispatch({ type: "SET_OPEN_DOCUMENT", payload: false });
      dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: true });
      dispatch({ type: "SET_SHOW_INITIAL_CONTENT", payload: false });

      // Check word credits before generating
      const remainingCredits = await checkWordCredits(user.id);

      // Estimate required credits (you can adjust this calculation)
      const estimatedWords = Math.ceil(productIdea.length / 4); // rough estimation

      if (remainingCredits < estimatedWords) {
        setInsufficientCredits(true);
        dispatch({ type: "SET_IS_GENERATING", payload: false });
        return;
      }

      const userInput = {
        role: "user",
        content: productIdea,
      };

      const updatedConversation = [...conversation, userInput];

      // Clear document content after sending
      setDocumentInfo("");
      setUploadedFiles([]);

      // Add thinking message
      const thinkingMessage = { role: "system", content: "Thinking..." };
      dispatch({
        type: "SET_CONVERSATION",
        payload: [...updatedConversation, thinkingMessage],
      });

      dispatch({ type: "SET_PRODUCT_IDEA", payload: "" });

      // Modified API call to include documentInfo separately
      const { reply } = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          conversation: updatedConversation,
          documentType,
          template,
          referenceDocument: documentInfo || null,
        }),
      }).then((res) => res.json());

      // Check if this is the first message
      const isFirstMessage = conversation.length === 0;

      if (isFirstMessage) {
        const initialTitle = extractInitialTitle(reply);
        const cleanedReply = reply
          .replace(/### Initial Title:.*?(?=\n|$)/, "")
          .trim();

        if (initialTitle) {
          // Update the document with initial title if it's a new document
          if (!selectedDocument) {
            await saveNewDocument(
              updatedConversation as { role: string; content: string }[],
              "", // No content yet
              initialTitle
            );
          }
        }

        // Display the cleaned reply
        const aiResponse = { role: "system", content: cleanedReply };
        const finalConversation = [...updatedConversation, aiResponse];
        dispatch({ type: "SET_CONVERSATION", payload: finalConversation });
        dispatch({ type: "SET_IS_GENERATING", payload: false });
      } else {
        // Extract final title and content for subsequent messages
        const documentContent = extractDocumentContent(reply);

        const finalTitle = extractFinalTitle(reply) || selectedDocument?.title;

        // Remove the document content and markers from the reply
        const cleanedReply = reply
          .replace(
            /### Generated Document[\s\S]*?### End of Generated Document/,
            ""
          )
          .trim();

        const aiResponse = { role: "system", content: cleanedReply };

        // This will replace the "thinking" message with the actual response
        const finalConversation = [...updatedConversation, aiResponse];
        dispatch({ type: "SET_CONVERSATION", payload: finalConversation });

        dispatch({ type: "SET_IS_GENERATING", payload: false });

        // Save the extracted document content only if it's not null
        if (documentContent) {
          dispatch({
            type: "SET_GENERATED_DOCUMENT",
            payload: documentContent,
          });

          if (!selectedDocument) {
            await saveNewDocument(
              finalConversation as { role: string; content: string }[],
              documentContent,
              finalTitle || productIdea
            );
          } else {
            await updateDocument(
              finalConversation as { role: string; content: string }[],
              documentContent,
              finalTitle || selectedDocument.title
            );
          }

          dispatch({ type: "SET_DOCUMENT_UPDATED", payload: true });
        }

        // Count words in the response
        const wordCount = reply.trim().split(/\s+/).length;

        // Deduct credits
        const updatedCredits = await deductWordCredits(user.id, wordCount);
        dispatch({
          type: "SET_WORD_CREDITS",
          payload: {
            remaining_credits: updatedCredits,
            total_words_generated:
              state.wordCredits?.total_words_generated + wordCount,
          },
        });
      }
    } catch (error) {
      console.error("Error generating document:", error);
      dispatch({ type: "SET_IS_GENERATING", payload: false });

      if (
        error instanceof Error &&
        error.message === "Insufficient word credits"
      ) {
        setInsufficientCredits(true);
      }

      // Remove the thinking message if there's an error
      dispatch({ type: "SET_CONVERSATION", payload: conversation });
    }
  };

  // Updated document content extraction to be more precise
  const extractDocumentContent = (text: string): string | null => {
    const documentRegex =
      /### Generated Document([\s\S]*?)### End of Generated Document/;
    const match = text.match(documentRegex);
    return match ? match[1].trim() : null; // Return null if no match
  };

  // Add new title extraction functions
  const extractInitialTitle = (text: string): string => {
    const titleRegex = /### Initial Title:(.*?)(?=\n|$)/;
    const match = text.match(titleRegex);
    return match ? match[1].trim() : "";
  };

  const extractFinalTitle = (text: string): string => {
    const titleRegex = /### Document Title:(.*?)(?=\n|$)/;
    const match = text.match(titleRegex);
    return match ? match[1].replace(/["']/g, "").trim() : "";
  };

  const saveNewDocument = async (
    finalConversation: { role: string; content: string }[],
    content: string,
    title: string
  ) => {
    if (!user || !user.id) {
      console.error("User not authenticated");
      return;
    }

    const newDocument = {
      user_id: user.id,
      title: title,
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
    content: string,
    title: string
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
        title: title,
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

  // const handleFileUpload = async (
  //   event: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const files = event.target.files;
  //   if (files && files.length > 0) {
  //     const file = files[0];

  //     try {
  //       // Create a FileReader to read the file content
  //       const reader = new FileReader();
  //       if (event.target.files && event.target.files[0]) {
  //         pdfToText(event.target.files[0])
  //           .then((text) => setDocumentInfo(text))
  //           .catch((error) => console.error("Failed to extract text from pdf"));
  //       }

  //       reader.onload = (e) => {
  //         const fileName = file.name;
  //         const fileExtension = fileName.split(".").pop() || "";

  //         // Add file to uploaded files state for display
  //         setUploadedFiles((prevFiles) => [
  //           ...prevFiles,
  //           { name: fileName, extension: fileExtension },
  //         ]);

  //         // Store the content in documentInfo state for reference
  //       };

  //       reader.readAsText(file);
  //     } catch (error) {
  //       console.error("Error reading file:", error);
  //     }
  //   }
  // };

  return (
    <div>
      {/* Add credits display */}
      {state.wordCredits && (
        <div className='text-sm text-gray-600 mb-2'>
          Available credits: {state.wordCredits.remaining_credits} words
        </div>
      )}
      {/* Show warning if credits are low */}
      {state.wordCredits &&
        state.wordCredits.remaining_credits < 50 &&
        !insufficientCredits && (
          <div className='text-amber-500 text-sm mb-2'>
            Warning: You are running low on credits!
          </div>
        )}

      {/* Show error if insufficient credits */}
      {insufficientCredits && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4'>
          <p className='text-red-600 text-sm'>
            You don't have enough word credits to generate this document.
            <Button
              variant='link'
              className='text-primary ml-2'
              onClick={() =>
                dispatch({ type: "SET_SHOW_UPGRADE_MODAL", payload: true })
              }
            >
              Topup
            </Button>
          </p>
        </div>
      )}

      <div className='flex gap-2 py-2'>
        {uploadedFiles.length > 0 && // Display uploaded file names if available
          uploadedFiles.map((file, index) => (
            <div className='p-2 flex items-center gap-2 bg-gray-100 rounded-xl relative'>
              <div
                key={index}
                className='text-[10px] text-bg h-10 rounded w-10 bg-gray-200 uppercase flex justify-center items-center bold '
              >
                <p>{file.extension}</p>
              </div>
              <p className='text-sm truncate max-w-[100px]'>{file.name}</p>
              <div
                onClick={() => {
                  setUploadedFiles((prevFiles) =>
                    prevFiles.filter((_, i) => i !== index)
                  );
                }}
                className='w-4 h-4 bg-black rounded-full cursor-pointer flex justify-center items-center absolute top-0 right-0'
              >
                <X size={13} color='white' />
              </div>
            </div>
          ))}
      </div>

      <div className='rounded-2xl outline-none w-full border border-[#bf8aeb4d]'>
        <div className='flex flex-col items-center gap-4'>
          <textarea
            className='resize-none overflow-auto w-full flex-1 bg-transparent p-3 pb-[1.5px] text-sm outline-none ring-0 placeholder:text-gray-500'
            style={{ minHeight: "30px", maxHeight: "384px", overflow: "auto" }}
            placeholder={placeholderText}
            id='productIdea'
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
            }}
          />

          <div className='flex justify-between w-full p-4'>
            <div className='w-10 h-10 flex items-center justify-center rounded bg-gray-100'>
              <input
                type='file'
                accept='.txt,.doc,.docx, .pdf'
                disabled // Specify accepted file types
                // onChange={handleFileUpload}
                className='hidden' // Hide the default file input
                id='fileUpload'
              />
              <label htmlFor='fileUpload' className='cursor-pointer'>
                <FileUp size={20} />
              </label>
            </div>
            <Button
              className='w-10 h-10  flex items-center justify-center rounded-full bg-black'
              onClick={handleGenerateDocument}
              disabled={
                !productIdea.trim() ||
                isGenerating ||
                insufficientCredits ||
                (wordCredits?.remaining_credits !== undefined &&
                  wordCredits.remaining_credits <= 0)
              }
            >
              {isGenerating ? (
                <AnimatedSparklesComponent />
              ) : (
                <div>
                  <ArrowUp size={15} />
                </div>
              )}
            </Button>
          </div>
          {/* {uploadStatus && ( // Show upload status if it exists
            <div className='mt-2 text-sm text-gray-600'>{uploadStatus}</div>
          )} */}
        </div>
      </div>
    </div>
  );
}
