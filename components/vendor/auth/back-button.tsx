"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  className?: string;
}

export function BackButton({ className }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className={`flex items-center justify-center w-10 h-10 bg-gray-200 hover:bg-gray-300 transition-colors ${className || ""}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5 text-black" />
    </button>
  );
}




