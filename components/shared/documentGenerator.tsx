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
  const [insufficientCredits, setInsufficientCredits] = useState<boolean>(false);
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
      const formattedConversation = updatedConversation.map(msg => ({
        role: msg.role || "user",
        content: msg.content || "",
      })).filter(msg => msg.content.trim() !== "");

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

      // Only update document if the response contains a generated document
      const documentContent = extractDocumentContent(content);
      if (documentContent && selectedDocument) {
        dispatch({
          type: "SET_GENERATED_DOCUMENT",
          payload: documentContent,
        });

        const finalTitle = extractFinalTitle(content) || selectedDocument.title;
        await updateDocument(
          finalConversation,
          documentContent,
          finalTitle
        );

        dispatch({ type: "SET_DOCUMENT_UPDATED", payload: true });
        await updateWordCredits(content);
      }

      dispatch({ type: "SET_IS_GENERATING", payload: false });
    } catch (error) {
      console.error("Error generating document:", error);
      handleError(error);
    }
  };

  const extractDocumentContent = (text: string | undefined): string | null => {
    if (!text) return null;
    const documentRegex = /### Generated Document([\s\S]*?)### End of Generated Document/;
    const match = text.match(documentRegex);
    return match ? match[1].trim() : null; // Return null if no document markers found
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
        description: error instanceof Error ? error.message : "Failed to read file",
        variant: "destructive",
      });
    }
  };

  const handleError = (error: unknown): void => {
    console.error("Error generating document:", error);
    dispatch({ type: "SET_IS_GENERATING", payload: false });
    
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to generate response",
      variant: "destructive",
    });

    if (error instanceof Error && error.message === "Insufficient word credits") {
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

    const aiResponse: ChatMessage = { role: "assistant", content: cleanedReply };
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

    const aiResponse: ChatMessage = { role: "assistant", content: cleanedReply };
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

  const extractInitialTitle = (text: string | undefined): string => {
    if (!text) return "";
    const titleRegex = /### Initial Title:(.*?)(?=\n|$)/;
    const match = text.match(titleRegex);
    return match ? match[1].trim() : "";
  };

  const extractFinalTitle = (text: string | undefined): string => {
    if (!text) return "";
    const titleRegex = /### Document Title:(.*?)(?=\n|$)/;
    const match = text.match(titleRegex);
    return match ? match[1].replace(/["']/g, "").trim() : "";
  };

  const saveNewDocument = async (
    finalConversation: ChatMessage[],
    content: string,
    title: string
  ): Promise<void> => {
    if (!user?.id) {
      console.error("User not authenticated");
      return;
    }

    const newDocument = {
      user_id: user.id,
      title,
      content,
      conversation: finalConversation,
    };

    const { data, error } = await supabase
      .from("documents")
      .insert(newDocument)
      .select();

    if (error) {
      console.error("Error saving document:", error);
      return;
    }

    if (data?.[0]) {
      dispatch({ type: "SET_SELECTED_DOCUMENT", payload: data[0] });
      dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: false });
      dispatch({ type: "SET_CURRENT_DOCUMENT_ID", payload: data[0].id });
      await fetchDocuments();
      dispatch({ type: "SET_IS_EDITOR_VISIBLE", payload: true });
    }
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
        conversation: finalConversation,
        title,
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
    <div className="flex flex-col w-full h-full max-h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col p-4 space-y-4">
          {conversation.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex items-start gap-4 rounded-lg p-4",
                message.role === "user"
                  ? "bg-primary/10 dark:bg-primary/20"
                  : "bg-muted/50 dark:bg-muted/20"
              )}
            >
              {message.role === "user" ? (
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  U
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-muted-foreground/20 dark:bg-muted-foreground/40 flex items-center justify-center">
                  AI
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm text-foreground whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isGenerating && (
            <div className="flex items-start gap-4 rounded-lg p-4 bg-muted/50 dark:bg-muted/20">
              <div className="w-8 h-8 rounded-full bg-muted-foreground/20 dark:bg-muted-foreground/40 flex items-center justify-center">
                AI
              </div>
              <div className="flex-1">
                <TypingBubble />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t dark:border-gray-800 p-4 bg-background">
        <div className="flex flex-col space-y-4">
          {uploadedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-muted/50 dark:bg-muted/20 rounded-full px-3 py-1"
                >
                  <span className="text-sm text-muted-foreground">{file.name}</span>
                  <button
                    onClick={() => {
                      setUploadedFiles((prev) =>
                        prev.filter((_, i) => i !== index)
                      );
                      setDocumentInfo("");
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholderText}
                rows={1}
                className="w-full resize-none bg-background border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-800"
                style={{
                  minHeight: "44px",
                  maxHeight: "200px",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isGenerating && inputValue.trim()) {
                      handleGenerateDocument();
                    }
                  }
                }}
              />
            </div>

            <div className="flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".txt,.pdf,.doc,.docx"
                />
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  disabled={isGenerating}
                >
                  <FileUp className="h-4 w-4" />
                </Button>
              </label>

              <Button
                type="submit"
                size="icon"
                disabled={isGenerating || !inputValue.trim()}
                onClick={handleGenerateDocument}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
