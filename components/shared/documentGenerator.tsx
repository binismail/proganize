import { useState } from "react";
import { Button } from "../ui/button";
import { useAppContext } from "@/app/context/appContext";
import { supabase } from "@/utils/supabase/instance";
import { ArrowUp, FileUp, X } from "lucide-react";
import { checkWordCredits, deductWordCredits } from "@/lib/wordCredit";
import AnimatedSparklesComponent from "./animatedSpark";
import { getToken } from "@/utils/supabaseOperations";
import sendEventToMixpanel from "@/lib/sendEventToMixpanel";
import pdfToText from "react-pdftotext";
import { Template } from "@/config/templates";
import { toast } from "@/hooks/use-toast";
import { TypingBubble } from "./typingBubble";
import { cn } from "@/lib/utils";

interface DocumentGeneratorProps {
  subscriptionStatus: string;
  placeholderText?: string;
  template?: string;
  documentType?: string;
}

interface UploadedFile {
  name: string;
  extension: string;
}

interface ChatMessage {
  role: string;
  content: string;
}

interface Document {
  id: string;
  user_id: string;
  title: string;
  content: string;
  conversation: ChatMessage[];
  created_at?: string;
  updated_at?: string;
}

interface APIResponse {
  reply: string;
}

interface WordCredits {
  remaining_credits: number;
  total_words_generated: number;
}

export default function DocumentGenerator({
  placeholderText = "Ask me anything related to your document",
  template,
  documentType,
  subscriptionStatus,
}: DocumentGeneratorProps) {
  const { state, dispatch } = useAppContext();
  const {
    user,
    conversation,
    selectedDocument,
    productIdea,
    wordCredits,
    isGenerating,
  } = state;

  const [documentInfo, setDocumentInfo] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [insufficientCredits, setInsufficientCredits] =
    useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");

  const handleGenerateDocument = async (): Promise<void> => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please sign in to continue",
        variant: "destructive",
      });
      return;
    }

    if (!inputValue.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    try {
      dispatch({ type: "SET_IS_GENERATING", payload: true });

      // Create user message
      const userMessage: ChatMessage = {
        role: "user",
        content: inputValue.trim(),
      };

      // Add user message to conversation immediately
      const updatedConversation = [...conversation, userMessage];
      dispatch({
        type: "SET_CONVERSATION",
        payload: updatedConversation,
      });

      // Clear input after sending
      setInputValue("");

      const token = await getToken();

      // Ensure all messages in conversation have role and content
      const formattedConversation = updatedConversation
        .map((msg) => ({
          role: msg.role || "user",
          content: msg.content || "",
        }))
        .filter((msg) => msg.content.trim() !== "");

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          conversation: formattedConversation,
          documentType,
          template,
          referenceDocument: documentInfo || selectedDocument?.content || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { content } = await response.json();

      if (!content) {
        throw new Error("No response from API");
      }

      // Add AI response to conversation
      const aiMessage: ChatMessage = {
        role: "assistant",
        content: content,
      };

      const finalConversation = [...updatedConversation, aiMessage];
      dispatch({
        type: "SET_CONVERSATION",
        payload: finalConversation,
      });

      // Check if this is the first message (initial title)
      const initialTitle = extractInitialTitle(content);
      if (initialTitle && !selectedDocument) {
        // Create a new document with initial title
        const newDoc = await saveNewDocument(
          finalConversation,
          "", // No content yet
          initialTitle
        );
        if (newDoc) {
          // Set selected document without conversation to match type
          const { conversation: _, ...docWithoutConversation } = newDoc;
          const docForState = {
            ...docWithoutConversation,
            created_at:
              docWithoutConversation.created_at || new Date().toISOString(),
            updated_at:
              docWithoutConversation.updated_at || new Date().toISOString(),
          };
          dispatch({
            type: "SET_SELECTED_DOCUMENT",
            payload: docForState,
          });
        } else {
          throw new Error("Failed to create new document");
        }
      }
      // Check for generated document content
      else if (selectedDocument) {
        const documentContent = extractDocumentContent(content);
        if (documentContent) {
          dispatch({
            type: "SET_GENERATED_DOCUMENT",
            payload: documentContent,
          });

          const finalTitle =
            extractFinalTitle(content) || selectedDocument.title;
          await updateDocument(finalConversation, documentContent, finalTitle);

          dispatch({ type: "SET_DOCUMENT_UPDATED", payload: true });
          await updateWordCredits(content);
        }
      }

      dispatch({ type: "SET_IS_GENERATING", payload: false });
    } catch (error) {
      console.error("Error generating document:", error);
      handleError(error);
    }
  };

  const extractInitialTitle = (text: string | undefined): string => {
    if (!text) return "";
    const titleRegex = /### Initial Title:(.*?)(?=\n|$)/;
    const match = text.match(titleRegex);
    return match ? match[1].trim() : "";
  };

  const extractDocumentContent = (text: string | undefined): string | null => {
    if (!text) return null;
    const documentRegex =
      /### Generated Document([\s\S]*?)### End of Generated Document/;
    const match = text.match(documentRegex);
    return match ? match[1].trim() : null;
  };

  const extractFinalTitle = (text: string | undefined): string => {
    if (!text) return "";
    const titleRegex = /### Document Title:(.*?)(?=\n|$)/;
    const match = text.match(titleRegex);
    return match ? match[1].replace(/["']/g, "").trim() : "";
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const files = event.target.files;
    if (!files?.length) return;

    const file = files[0];
    try {
      let text = "";
      if (file.type === "application/pdf") {
        text = await pdfToText(file);
        if (typeof text !== "string") {
          throw new Error("PDF text extraction failed");
        }
      } else {
        text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result && typeof e.target.result === "string") {
              resolve(e.target.result);
            } else {
              reject(new Error("Failed to read file"));
            }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsText(file);
        });
      }

      setDocumentInfo(text);
      const fileName = file.name;
      const fileExtension = fileName.split(".").pop() || "";
      setUploadedFiles([{ name: fileName, extension: fileExtension }]);
    } catch (error) {
      console.error("Error reading file:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to read file",
        variant: "destructive",
      });
    }
  };

  const handleError = (error: unknown): void => {
    console.error("Error generating document:", error);
    dispatch({ type: "SET_IS_GENERATING", payload: false });

    toast({
      title: "Error",
      description:
        error instanceof Error ? error.message : "Failed to generate response",
      variant: "destructive",
    });

    if (
      error instanceof Error &&
      error.message === "Insufficient word credits"
    ) {
      setInsufficientCredits(true);
    }
  };

  const handleFirstMessage = async (
    reply: string | undefined,
    updatedConversation: ChatMessage[]
  ): Promise<void> => {
    if (!reply) {
      dispatch({ type: "SET_IS_GENERATING", payload: false });
      return;
    }

    const initialTitle = extractInitialTitle(reply);
    const cleanedReply = reply
      .replace(/### Initial Title:.*?(?=\n|$)/, "")
      .trim();

    if (initialTitle && !selectedDocument) {
      await saveNewDocument(updatedConversation, "", initialTitle);
      sendEventToMixpanel("document_generated", user);
    }

    const aiResponse: ChatMessage = {
      role: "assistant",
      content: cleanedReply,
    };
    const finalConversation = [...updatedConversation, aiResponse];
    dispatch({ type: "SET_CONVERSATION", payload: finalConversation });
    dispatch({ type: "SET_IS_GENERATING", payload: false });
  };

  const handleSubsequentMessage = async (
    reply: string | undefined,
    updatedConversation: ChatMessage[]
  ): Promise<void> => {
    if (!reply) {
      dispatch({ type: "SET_IS_GENERATING", payload: false });
      return;
    }

    const documentContent = extractDocumentContent(reply);
    const finalTitle = extractFinalTitle(reply) || selectedDocument?.title;
    const cleanedReply = reply
      .replace(
        /### Generated Document[\s\S]*?### End of Generated Document/,
        ""
      )
      .trim();

    const aiResponse: ChatMessage = {
      role: "assistant",
      content: cleanedReply,
    };
    const finalConversation = [...updatedConversation, aiResponse];
    dispatch({ type: "SET_CONVERSATION", payload: finalConversation });
    dispatch({ type: "SET_IS_GENERATING", payload: false });

    if (documentContent) {
      dispatch({
        type: "SET_GENERATED_DOCUMENT",
        payload: documentContent,
      });

      sendEventToMixpanel("document_generated", user);

      if (!selectedDocument) {
        await saveNewDocument(
          finalConversation,
          documentContent,
          finalTitle || productIdea
        );
      } else {
        await updateDocument(
          finalConversation,
          documentContent,
          finalTitle || selectedDocument.title
        );
      }

      dispatch({ type: "SET_DOCUMENT_UPDATED", payload: true });
      await updateWordCredits(reply);
    }
  };

  const updateWordCredits = async (reply: string): Promise<void> => {
    if (!user?.id || !reply) return;

    const wordCount = reply.trim().split(/\s+/).length;
    const updatedCredits = await deductWordCredits(user.id, wordCount);

    sendEventToMixpanel("ai_word_used", user, { count: wordCount });

    dispatch({
      type: "SET_WORD_CREDITS",
      payload: {
        remaining_credits: updatedCredits,
        total_words_generated:
          (wordCredits?.total_words_generated || 0) + wordCount,
      },
    });
  };

  const saveNewDocument = async (
    finalConversation: ChatMessage[],
    content: string,
    title: string
  ): Promise<Document | null> => {
    if (!user?.id) {
      console.error("User not authenticated");
      return null;
    }

    const newDocument = {
      user_id: user.id,
      title,
      content,
      conversation: [], // Initialize with empty conversation in database
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("documents")
      .insert(newDocument)
      .select()
      .single();

    if (error) {
      console.error("Error saving document:", error);
      toast({
        title: "Error",
        description: "Failed to save document",
        variant: "destructive",
      });
      return null;
    }

    // Add conversation to local state only
    const documentWithConversation = {
      ...data,
      conversation: finalConversation,
    };

    // Update app state
    dispatch({ type: "SET_CONVERSATION", payload: finalConversation });

    return documentWithConversation;
  };

  const updateDocument = async (
    finalConversation: ChatMessage[],
    content: string,
    title: string
  ): Promise<void> => {
    if (!selectedDocument?.id) {
      console.error("No document selected for update");
      return;
    }

    const { data, error } = await supabase
      .from("documents")
      .update({
        content,
        conversation: [], // Don't update conversation in database
        title,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedDocument.id)
      .select();

    if (error) {
      console.error("Error updating document:", error);
      return;
    }

    if (data?.[0]) {
      dispatch({ type: "SET_SELECTED_DOCUMENT", payload: data[0] });
      await fetchDocuments();
    }
  };

  const fetchDocuments = async (): Promise<void> => {
    if (!user?.id) return;

    try {
      const [ownedDocsResult, collaborativeDocsResult] = await Promise.all([
        supabase
          .from("documents")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("document_collaborators")
          .select("document_id")
          .eq("user_id", user.id),
      ]);

      if (ownedDocsResult.error) throw ownedDocsResult.error;
      if (collaborativeDocsResult.error) throw collaborativeDocsResult.error;

      let collabDocsDetails: Document[] = [];
      if (collaborativeDocsResult.data?.length) {
        const { data: collabDetails, error: detailsError } = await supabase
          .from("documents")
          .select("*")
          .in(
            "id",
            collaborativeDocsResult.data.map((doc) => doc.document_id)
          )
          .order("created_at", { ascending: false });

        if (detailsError) throw detailsError;
        collabDocsDetails = collabDetails || [];
      }

      const allDocs = [...(ownedDocsResult.data || []), ...collabDocsDetails];
      const uniqueDocs = Array.from(new Set(allDocs.map((doc) => doc.id))).map(
        (id) => allDocs.find((doc) => doc.id === id)!
      );

      dispatch({ type: "SET_DOCUMENTS", payload: uniqueDocs });
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      dispatch({ type: "SET_IS_LOADING", payload: false });
    }
  };

  return (
    <div className='border-t dark:border-gray-800 p-4 bg-background'>
      <div className='flex flex-col space-y-4'>
        <div className='flex gap-2 py-2'>
          {uploadedFiles.length > 0 && // Display uploaded file names if available
            uploadedFiles.map((file, index) => (
              <div key={index} className='p-2 flex items-center gap-2 bg-gray-100 rounded-xl relative'>
                <div
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
              value={inputValue}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerateDocument();
                }
              }}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isGenerating}
            />

            <div className='flex justify-between w-full p-4'>
              <div className='w-10 h-10 flex items-center justify-center rounded bg-gray-100'>
                <input
                  type='file'
                  accept='.txt,.doc,.docx,.pdf'
                  onChange={handleFileUpload}
                  className='hidden'
                  id='fileUpload'
                />
                <label htmlFor='fileUpload' className='cursor-pointer'>
                  <FileUp size={20} />
                </label>
              </div>
              <Button
                className='w-10 h-10 flex items-center justify-center rounded-full bg-black'
                onClick={handleGenerateDocument}
                disabled={
                  !inputValue.trim() ||
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
          </div>
        </div>
      </div>
    </div>
  );
}
