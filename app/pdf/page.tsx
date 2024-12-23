"use client";

import { useAppContext } from "../context/appContext";
import PDFConversationList from "@/components/pdf/pdfConversationList";
import ChatLayer from "@/components/chat/chatLayer";
import PDFViewer from "@/components/pdf/pdfViewer";
import { useState, useCallback, useEffect } from "react";
import Nav from "@/components/layout/nav";
import { supabase } from "@/utils/supabase/instance";
import { STORAGE_CONSTANTS } from "@/utils/constants";

export default function ChatPage() {
  const { state } = useAppContext();
  const [extractedText, setExtractedText] = useState("");
  const [outline, setOutline] = useState<any[]>([]);
  const [pdfFile, setPdfFile] = useState<string | null>(null);

  const handleTextExtracted = useCallback((text: string) => {
    setExtractedText(text);
  }, []);

  const handleOutlineExtracted = useCallback((outlineData: any[]) => {
    setOutline(outlineData);
  }, []);

  // Load PDF file when conversation changes
  const loadPDFFile = useCallback(async () => {
    if (state.currentPDFConversation?.pdf_url) {
      try {
        console.log(
          "Getting signed URL for:",
          state.currentPDFConversation.pdf_url
        );
        const { data: pdfData, error } = await supabase.storage
          .from(STORAGE_CONSTANTS.BUCKET_NAME)
          .createSignedUrl(state.currentPDFConversation.pdf_url, 3600);

        if (error) {
          console.error("Error getting signed URL:", error);
          throw error;
        }

        if (pdfData?.signedUrl) {
          console.log("Got signed URL:", pdfData.signedUrl);
          setPdfFile(pdfData.signedUrl);
        } else {
          console.error("No signed URL returned");
          setPdfFile(null);
        }
      } catch (error) {
        console.error("Error loading PDF:", error);
        setPdfFile(null);
      }
    } else {
      console.log("No PDF URL in current conversation");
      setPdfFile(null);
    }
  }, [state.currentPDFConversation]);

  // Update PDF file when conversation changes
  useEffect(() => {
    if (state.currentPDFConversation) {
      console.log(
        "Loading PDF for conversation:",
        state.currentPDFConversation.id
      );
      loadPDFFile();
    } else {
      // Clear PDF file when no conversation is selected
      console.log("Clearing PDF file - no conversation selected");
      setPdfFile(null);
      setExtractedText("");
      setOutline([]);
    }
  }, [loadPDFFile, state.currentPDFConversation]);

  return (
    <div className='flex'>
      <Nav />
      <div className='flex flex-1 overflow-hidden'>
        {/* Sidebar - PDF Conversations */}
        {/* <div className=' bg-background'>
          <div className='p-4 '>
            <h2 className='font-semibold'>Chat Conversations</h2>
          </div>
        </div> */}
        <div className='w-72 border-r overflow-auto h-[calc(100vh-theme(spacing.16))]'>
          <PDFConversationList />
        </div>

        {/* Main Content Area */}
        <div className='flex flex-1 min-w-0'>
          {/* Chat Area */}
          <div className='flex-1 min-w-0 border-r'>
            <ChatLayer extractedText={extractedText} />
          </div>

          {/* PDF Viewer */}
          <div className='w-[45%] bg-muted/30'>
            <PDFViewer
              file={pdfFile}
              onTextExtracted={handleTextExtracted}
              onOutlineExtracted={handleOutlineExtracted}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
