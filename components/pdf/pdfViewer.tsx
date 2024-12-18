"use client";

import { useState, useCallback, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
} from "lucide-react";
import { useAppContext } from "@/app/context/appContext";
import { pdfService } from "@/utils/services/pdfService";
import PDFAnalysisTools from "./pdfAnalysisTools";

// Set worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: string | null;
  onTextExtracted: (text: string) => void;
  onOutlineExtracted: (outline: any[]) => void;
}

export default function PDFViewer({
  file,
  onTextExtracted,
  onOutlineExtracted,
}: PDFViewerProps) {
  const { state } = useAppContext();
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPDF = useCallback(async (url: string) => {
    try {
      console.log("Fetching PDF from URL:", url);
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);
      return pdfUrl;
    } catch (error) {
      console.error("Error fetching PDF:", error);
      throw error;
    }
  }, []);

  const extractPDFContent = async (pdfDoc: any, numPages: number) => {
    const MAX_PAGES_PER_BATCH = 50;
    let fullText = "";

    console.log(`Starting extraction of ${numPages} pages`);

    // Process pages in batches
    for (
      let batchStart = 1;
      batchStart <= numPages;
      batchStart += MAX_PAGES_PER_BATCH
    ) {
      const batchEnd = Math.min(batchStart + MAX_PAGES_PER_BATCH - 1, numPages);
      console.log(`Processing batch: pages ${batchStart} to ${batchEnd}`);

      const batchPromises = [];
      for (let i = batchStart; i <= batchEnd; i++) {
        batchPromises.push(
          pdfDoc.getPage(i).then(async (page: any) => {
            console.log(`Extracting text from page ${i}`);
            const textContent = await page.getTextContent();
            return textContent.items.map((item: any) => item.str).join(" ");
          })
        );
      }

      const batchTexts = await Promise.all(batchPromises);
      fullText += batchTexts.join("\n\n");

      // Small delay between batches to prevent overwhelming the system
      if (batchEnd < numPages) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return fullText;
  };

  const onDocumentLoadSuccess = useCallback(
    async ({ numPages }: { numPages: number }) => {
      console.log("PDF loaded successfully, pages:", numPages);
      setNumPages(numPages);
      setLoading(false);

      if (!file || !state.currentPDFConversation?.id || !state.user?.id) {
        console.log("Missing required data for PDF processing");
        return;
      }

      try {
        // First save basic metadata to indicate processing has started
        await pdfService.saveExtractedContent(
          state.currentPDFConversation.id,
          {
            content: "",
            metadata: {
              pageCount: numPages,
              status: "processing",
            },
          },
          state.user.id
        );

        const loadingTask = pdfjs.getDocument(file);
        const pdfDoc = await loadingTask.promise;

        // Extract metadata
        const metadata = await pdfDoc.getMetadata();
        const metadataInfo = metadata?.info || {};

        // Extract text content in batches
        const fullText = await extractPDFContent(pdfDoc, numPages);

        // Save complete content
        const savedContent = await pdfService.saveExtractedContent(
          state.currentPDFConversation.id,
          {
            content: fullText,
            metadata: {
              ...metadataInfo,
              pageCount: numPages,
              status: "complete",
            },
          },
          state.user.id
        );

        if (savedContent) {
          console.log("Content saved successfully");
          onTextExtracted(fullText);
        } else {
          throw new Error("Failed to save extracted content");
        }
      } catch (error) {
        console.error("Error processing PDF:", error);
        // Update metadata to indicate error
        await pdfService.saveExtractedContent(
          state.currentPDFConversation.id,
          {
            content: "",
            metadata: {
              pageCount: numPages,
              status: "error",
              error: error instanceof Error ? error.message : "Unknown error",
            },
          },
          state.user.id
        );

        setError(error instanceof Error ? error.message : "Failed to load PDF");
        setLoading(false);
      }
    },
    [file, onTextExtracted, state.currentPDFConversation?.id, state.user?.id]
  );

  // Reset state when file changes
  useEffect(() => {
    let pdfUrl: string | null = null;

    const loadPDFFile = async () => {
      setPageNumber(1);
      setLoading(true);
      setError(null);

      if (!file) {
        setLoading(false);
        return;
      }

      try {
        pdfUrl = await loadPDF(file);
        // The Document component will handle the actual loading
      } catch (error) {
        console.error("Error loading PDF:", error);
        setError(error instanceof Error ? error.message : "Failed to load PDF");
        setLoading(false);
      }
    };

    loadPDFFile();

    // Cleanup
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [file, loadPDF]);

  if (!file) {
    return (
      <div className='flex flex-col items-center justify-center h-full p-4 text-center'>
        <div className='mb-4'>
          <FileText className='w-12 h-12 text-muted-foreground' />
        </div>
        <h3 className='text-lg font-medium'>No PDF Selected</h3>
        <p className='text-sm text-muted-foreground'>
          Select a conversation or start a new chat to view PDF
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center h-full p-4 text-center'>
        <div className='mb-4 text-destructive'>
          <FileText className='w-12 h-12' />
        </div>
        <h3 className='text-lg font-medium text-destructive'>
          Error Loading PDF
        </h3>
        <p className='text-sm text-muted-foreground'>{error}</p>
        <Button className='mt-4' onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full'>
      {/* PDF Controls */}
      <div className='flex items-center justify-between p-4 border-b'>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => setScale((prev) => Math.max(0.5, prev - 0.1))}
          >
            <ZoomOut className='h-4 w-4' />
          </Button>
          <span className='text-sm'>{Math.round(scale * 100)}%</span>
          <Button
            variant='outline'
            size='icon'
            onClick={() => setScale((prev) => Math.min(2, prev + 0.1))}
          >
            <ZoomIn className='h-4 w-4' />
          </Button>
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <span className='text-sm'>
            Page {pageNumber} of {numPages}
          </span>
          <Button
            variant='outline'
            size='icon'
            onClick={() =>
              setPageNumber((prev) => Math.min(numPages, prev + 1))
            }
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className='flex-1 overflow-auto'>
        {loading ? (
          <div className='flex items-center justify-center h-full'>
            <Loader2 className='w-8 h-8 animate-spin' />
          </div>
        ) : error ? (
          <div className='flex items-center justify-center h-full text-red-500'>
            {error}
          </div>
        ) : (
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => {
              console.error("Error loading document:", error);
              setError("Failed to load PDF. Please try again.");
              setLoading(false);
            }}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            ))}
          </Document>
        )}
      </div>

      {/* Analysis Tools */}
      <div className='border-t'>
        <PDFAnalysisTools />
      </div>
    </div>
  );
}
