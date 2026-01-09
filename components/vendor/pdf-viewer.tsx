"use client";

import { Document, Page, pdfjs } from "react-pdf";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: string;
}

export default function PDFViewer({ file }: PDFViewerProps) {
  return (
    <div className="flex items-start justify-center h-64 w-full">
      <Document
        file={file}
        onLoadError={(error) => console.error('Error loading PDF:', error)}
        className="flex items-center justify-center"
      >
        <Page
          pageNumber={1}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          className="max-h-64"
          width={400}
        />
      </Document>
    </div>
  );
}
