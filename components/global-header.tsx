"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

export function GlobalHeader() {
  const handleHelpClick = () => {
    // WhatsApp link - you can customize the phone number and message
    const phoneNumber = "+919745870917"; // Add your WhatsApp number here (with country code, no + or spaces)
    const message = encodeURIComponent("Hello, I need help with ArmoredMart");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Image
            src="/images/name-logo.svg"
            alt="ArmoredMart Logo"
            width={150}
            height={80}
            priority
            // className="h-8 w-auto"
          />
        </div>

        {/* Help Button */}
        <Button
          onClick={handleHelpClick}
          variant="secondary"
          className="flex items-center gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          Help
        </Button>
      </div>
    </header>
  );
}
