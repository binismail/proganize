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

      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: inputValue,
          template: template,
          values: {
            productIdea,
            documentInfo,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 402) {
          toast({
            title: "Insufficient Credits",
            description: "Please upgrade your plan to continue generating content.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(error.message || "Failed to generate content");
      }

      const data = await response.json();

      // Update word credits in global state
      if (data.remainingCredits !== undefined) {
        dispatch({
          type: "SET_WORD_CREDITS",
          payload: {
            remaining_credits: data.remainingCredits,
            total_words_generated: state.wordCredits?.total_words_generated || 0,
          },
        });
      }

      // Extract title from the response
      const titleMatch = data.content.match(/### Initial Title: (.+)/);
      const title = titleMatch ? titleMatch[1].trim() : "Untitled Document";

      // Extract document content
      const contentMatch = data.content.match(/### Generated Document\n([\s\S]*?)### End of Generated Document/);
      const documentContent = contentMatch ? contentMatch[1].trim() : data.content;

      // Create new document
      const { data: document, error: documentError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          title: title,
          content: documentContent,
          conversation: [
            {
              role: "user",
              content: inputValue,
            },
            {
              role: "assistant",
              content: documentContent,
            },
          ],
        })
        .select()
        .single();

      if (documentError) throw documentError;

      // Update UI state
      dispatch({ type: "SET_DOCUMENTS", payload: [...state.documents, document] });
      dispatch({ type: "SET_SELECTED_DOCUMENT", payload: document });
      dispatch({ type: "SET_CONVERSATION", payload: document.conversation });
      dispatch({ type: "SET_GENERATED_DOCUMENT", payload: document.content });
      dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: true });
      dispatch({ type: "SET_CURRENT_DOCUMENT_ID", payload: document.id });
      dispatch({ type: "SET_SHOW_INITIAL_CONTENT", payload: false });
      dispatch({ type: "SET_HAS_GENERATION_STARTED", payload: true });

      // Clear input and file state
      setInputValue("");
      setUploadedFiles([]);
      setDocumentInfo("");

      // Track event
      sendEventToMixpanel("Document Generated", {
        template: template || "custom",
        documentType: documentType || "general",
      });

    } catch (error) {
      console.error("Error generating document:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate document",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: "SET_IS_GENERATING", payload: false });
    }
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

  return (
    <div className='border-t dark:border-gray-800 p-4 bg-background'>
      <div className='flex flex-col space-y-4'>
        <div className='flex gap-2 py-2'>
          {uploadedFiles.length > 0 && // Display uploaded file names if available
            uploadedFiles.map((file, index) => (
              <div
                key={index}
                className='p-2 flex items-center gap-2 bg-gray-100 rounded-xl relative'
              >
                <div className='text-[10px] text-bg h-10 rounded w-10 bg-gray-200 uppercase flex justify-center items-center bold '>
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
              style={{
                minHeight: "30px",
                maxHeight: "384px",
                overflow: "auto",
              }}
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
