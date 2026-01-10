import type { Metadata } from "next";
import { Sidebar } from "@/components/admin/sidebar";
import { GlobalHeader } from "@/components/global-header";

export const metadata: Metadata = {
  title: "ArmoredMart Admin",
  description: "Admin panel for managing ArmoredMart products, orders, and admins.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <GlobalHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}


