"use client";

import dynamic from 'next/dynamic';

// Dynamically import the PDFViewer component with SSR disabled
const PDFViewer = dynamic(
  () => import('./pdfViewer'),
  { 
    ssr: false,
    loading: () => <div>Loading PDF viewer...</div>
  }
);

export default PDFViewer;
