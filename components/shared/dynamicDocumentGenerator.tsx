"use client";

import dynamic from 'next/dynamic';

// Dynamically import the DocumentGenerator component with SSR disabled
const DocumentGenerator = dynamic(
  () => import('./documentGenerator'),
  { 
    ssr: false,
    loading: () => <div>Loading document generator...</div>
  }
);

export default DocumentGenerator;
