import { GlobalHeader } from "@/components/global-header";

export default function VendorAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <GlobalHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
