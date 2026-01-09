"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FileText } from "lucide-react";

interface PDFPreviewProps {
  file: File | string | null;
  className?: string;
  fallbackIcon?: React.ReactNode;
}

export function PDFPreview({ file, className = "", fallbackIcon }: PDFPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    // Handle File object
    if (file instanceof File) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setFileType(file.type);

      return () => {
        URL.revokeObjectURL(url);
      };
    }

    // Handle URL string
    if (typeof file === "string") {
      setPreviewUrl(file);
      // Determine file type from URL
      const extension = file.split(".").pop()?.toLowerCase();
      if (extension === "pdf") {
        setFileType("application/pdf");
      } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
        setFileType("image");
      }
    }
  }, [file]);

  if (!previewUrl) {
    return fallbackIcon || <FileText className="h-12 w-12 text-gray-400" />;
  }

  // For images, show the image directly
  if (fileType.startsWith("image/") || fileType === "image") {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={previewUrl}
          alt="Preview"
          fill
          className="object-cover rounded-lg"
          onError={() => setError(true)}
        />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>
    );
  }

  // For PDFs, show an embedded preview
  if (fileType === "application/pdf") {
    return (
      <div className={`relative ${className} bg-white rounded-lg overflow-hidden`}>
        <iframe
          src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&page=1&view=FitH`}
          className="w-full h-full pointer-events-none"
          title="PDF Preview"
          onError={() => setError(true)}
        />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
        )}
        {/* Overlay to prevent interaction */}
        <div className="absolute inset-0 pointer-events-none" />
      </div>
    );
  }

  // Fallback for unknown file types
  return fallbackIcon || <FileText className="h-12 w-12 text-gray-400" />;
}
