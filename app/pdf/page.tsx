"use client";

import { useAppContext } from "../context/appContext";
import PDFConversationList from "@/components/pdf/pdfConversationList";
import ChatLayer from "@/components/chat/chatLayer";
import DynamicPDFViewer from "@/components/pdf/dynamicPdfViewer";
import { useState, useCallback, useEffect } from "react";
import Nav from "@/components/layout/nav";
import { supabase } from "@/utils/supabase/instance";
import { STORAGE_CONSTANTS } from "@/utils/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalysisPanel } from "@/components/pdf/analysisPanel"; 
import { pdfService } from "@/utils/services/pdfService";

export default function ChatPage() {
  const { state } = useAppContext();
  const [extractedText, setExtractedText] = useState("");
  const [outline, setOutline] = useState<any[]>([]);
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [savedContent, setSavedContent] = useState<string>("");
  const [activeTab, setActiveTab] = useState("chat");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTextExtracted = useCallback((text: string) => {
    setExtractedText(text);
  }, []);

  const handleOutlineExtracted = useCallback((outlineData: any[]) => {
    setOutline(outlineData);
  }, []);

  // Load PDF file when conversation changes
  const loadPDFFile = useCallback(async () => {
    if (!state.currentPDFConversation?.pdf_url || !state.user?.id) {
      console.log("No PDF URL in current conversation or no user");
      setPdfFile(null);
      setSavedContent("");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get the saved content first
      const content = await pdfService.getExtractedContent(
        state.currentPDFConversation.id,
        state.user.id
      );
      
      if (content?.content) {
        console.log("Using saved content for analysis");
        setSavedContent(content.content);
      }

      // Get signed URL for PDF viewing
      const { data: pdfData, error: urlError } = await supabase.storage
        .from(STORAGE_CONSTANTS.BUCKET_NAME)
        .createSignedUrl(state.currentPDFConversation.pdf_url, 3600);

      if (urlError) {
        console.error("Error getting signed URL:", urlError);
        setError("Failed to load PDF. Please try again.");
        setPdfFile(null);
        return;
      }

      if (pdfData?.signedUrl) {
        console.log("Got signed URL");
        setPdfFile(pdfData.signedUrl);
      } else {
        console.error("No signed URL returned");
        setError("Failed to load PDF. Please try again.");
        setPdfFile(null);
      }
    } catch (error) {
      console.error("Error loading PDF:", error);
      setError("An unexpected error occurred. Please try again.");
      setPdfFile(null);
    } finally {
      setIsLoading(false);
    }
  }, [state.currentPDFConversation, state.user?.id]);

  // Update PDF file when conversation changes
  useEffect(() => {
    loadPDFFile();
  }, [loadPDFFile]);

  // Clear states when conversation is cleared
  useEffect(() => {
    if (!state.currentPDFConversation) {
      setPdfFile(null);
      setExtractedText("");
      setOutline([]);
      setSavedContent("");
      setError(null);
    }
  }, [state.currentPDFConversation]);

  return (
    <div className='flex'>
      <Nav />
      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar - PDF Conversations */}
        <div className='w-72 border-r overflow-auto h-[calc(100vh-theme(spacing.16))]'>
          <PDFConversationList />
        </div>

        {/* Main Content Area */}
        <div className='flex flex-1 min-w-0'>
          {/* Chat Area */}
          <div className='flex-1 min-w-0 border-r'>
            <ChatLayer extractedText={extractedText} />
          </div>

          {/* PDF Viewer and Analysis */}
          <div className='w-[45%] bg-muted/30'>
            <Tabs defaultValue='analysis' className='h-full flex flex-col'>
              <div className='border-b px-4'>
                <TabsList className='w-full justify-start my-3'>
                  <TabsTrigger value='analysis'>Detailed Analysis</TabsTrigger>
                  <TabsTrigger value='viewer'>Your pdf</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value='viewer' className='flex-1'>
                {isLoading ? (
                  <div>Loading...</div>
                ) : error ? (
                  <div>Error: {error}</div>
                ) : (
                  <DynamicPDFViewer
                    file={pdfFile}
                    onTextExtracted={handleTextExtracted}
                    onOutlineExtracted={handleOutlineExtracted}
                  />
                )}
              </TabsContent>

              <TabsContent
                value='analysis'
                className='flex-1 p-4 overflow-auto'
              >
                <AnalysisPanel pdfContent={savedContent || extractedText} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
