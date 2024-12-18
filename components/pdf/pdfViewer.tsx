"use client";

import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: string | File | null;
  onTextExtracted: (text: string) => void;
  onOutlineExtracted: (outline: any[]) => void;
}

export default function PDFViewer({
  file,
  onTextExtracted,
  onOutlineExtracted,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [highlights, setHighlights] = useState<string[]>([]);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);

      // Extract outline
      if (file) {
        pdfjs
          .getDocument(file instanceof File ? URL.createObjectURL(file) : file)
          .promise.then((pdf) => {
            pdf.getOutline().then((outline) => {
              onOutlineExtracted(outline || []);
            });
          });
      }
    },
    [file, onOutlineExtracted]
  );

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => {
      const newPageNumber = prevPageNumber + offset;
      return newPageNumber > 0 && newPageNumber <= numPages
        ? newPageNumber
        : prevPageNumber;
    });
  };

  const changeScale = (delta: number) => {
    setScale((prevScale) => {
      const newScale = prevScale + delta;
      return newScale > 0.5 && newScale <= 2 ? newScale : prevScale;
    });
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setHighlights((prev) => [...prev, selection.toString()]);
    }
  };

  const extractTextFromPage = useCallback(
    (page: any) => {
      page.getTextContent().then((textContent: any) => {
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        onTextExtracted(pageText);
      });
    },
    [onTextExtracted]
  );

  return (
    <div className='flex flex-col items-center'>
      <div className='flex items-center justify-between w-full mb-4'>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => changeScale(-0.1)}
          >
            <ZoomOut className='h-4 w-4' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            onClick={() => changeScale(0.1)}
          >
            <ZoomIn className='h-4 w-4' />
          </Button>
          <span className='text-sm'>{Math.round(scale * 100)}%</span>
        </div>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className='h-4 w-4' />
          </Button>
          <Input
            type='number'
            min={1}
            max={numPages}
            value={pageNumber}
            onChange={(e) => setPageNumber(Number(e.target.value))}
            className='w-16 text-center'
          />
          <span className='text-sm'>of {numPages}</span>
          <Button
            variant='outline'
            size='icon'
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>
      <div className='border rounded-lg overflow-auto max-h-[calc(100vh-200px)]'>
        <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
          <Page
            pageNumber={pageNumber}
            scale={scale}
            onLoadSuccess={extractTextFromPage}
            onRenderTextLayerSuccess={handleTextSelection}
          />
        </Document>
      </div>
      <div className='mt-4 w-full'>
        <h3 className='font-semibold mb-2'>Highlights:</h3>
        <ul className='list-disc pl-5'>
          {highlights.map((highlight, index) => (
            <li key={index} className='text-sm'>
              {highlight}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
