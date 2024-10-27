import { useRef, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useAppContext } from "@/app/context/appContext";
import autosize from "autosize";
import { supabase } from "@/utils/supabase/instance";
import { Spinner } from "./spinner";
import { checkAndUpdateConversationCount } from "@/utils/supabaseOperations";
import Link from "next/link";
import { Input } from "../ui/input";
import { ArrowUp, FileUp, X } from "lucide-react";

// Update the type definition for conversation

export default function DocumentGenerator({
  subscriptionStatus,
  placeholderText = "Ask me anything related to your document",
  template,
  documentType,
}: {
  subscriptionStatus: string;
  placeholderText: string;
  template: string;
  documentType: string;
}) {
  const { state, dispatch } = useAppContext();
  const { productIdea, isGenerating, conversation, selectedDocument, user } =
    state;

  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [nextResetTime, setNextResetTime] = useState<Date | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null); // New state for upload status
  const [uploadedFiles, setUploadedFiles] = useState<
    { name: string; extension: string }[]
  >([]); // New state for uploaded file names and extensions

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

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setUploadStatus("Uploading..."); // Set status to uploading
      try {
        // Extract file name and extension
        const fileName = file.name;
        const fileExtension = fileName.split(".").pop() || ""; // Get the file extension
        setUploadedFiles((prevFiles) => [
          ...prevFiles,
          { name: fileName, extension: fileExtension },
        ]); // Add new file info to the array
        setUploadStatus("Uploaded"); // Update status to uploaded
      } catch (error) {
        console.error("Error reading file:", error);
        setUploadStatus("Upload failed"); // Handle error
      }
    }
  };

  return (
    <div>
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
            disabled={dailyLimitReached}
          />

          <div className='flex justify-between w-full p-4'>
            <div className='w-10 h-10 flex items-center justify-center rounded bg-gray-100'>
              <input
                type='file'
                accept='.txt,.doc,.docx, .pdf' // Specify accepted file types
                onChange={handleFileUpload}
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
                !productIdea.trim() || isGenerating || dailyLimitReached
              }
            >
              {isGenerating ? (
                <Spinner size='sm' />
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
