import { VendorSidebar } from "@/components/vendor/sidebar";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <VendorSidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}


