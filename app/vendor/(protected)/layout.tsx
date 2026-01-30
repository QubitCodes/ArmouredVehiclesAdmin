import { Sidebar } from "@/components/admin/sidebar";

export default function VendorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen flex-col overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto bg-background">
                    <div className="container mx-auto p-6">{children}</div>
                </main>
            </div>
        </div>
    );
}
