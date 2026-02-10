import type { Metadata } from "next";
import { Sidebar } from "@/components/admin/sidebar";
import { VerificationGuard } from "@/components/vendor/verification-guard";

export const metadata: Metadata = {
  title: "ArmoredMart Admin",
  description: "Admin panel for managing ArmoredMart products, orders, and admins.",
};

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto p-6">
            {domain === "vendor" ? (
              <VerificationGuard>{children}</VerificationGuard>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


