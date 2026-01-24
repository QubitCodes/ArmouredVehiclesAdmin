"use client";

import { VendorSidebar } from "@/components/vendor/sidebar";
import { VerificationGuard } from "@/components/vendor/verification-guard";
import { GlobalHeader } from "@/components/global-header";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VerificationGuard>
      <div className="flex h-screen flex-col overflow-hidden">
        <GlobalHeader />
        <div className="flex flex-1 overflow-hidden">
          <VendorSidebar />
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="container mx-auto p-6">{children}</div>
          </main>
        </div>
      </div>
    </VerificationGuard>
  );
}


