
import { WebFrontendManager } from "@/components/admin/web-frontend/web-frontend-manager";
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Web Frontend | Admin',
    description: 'Manage homepage sliders and website ads',
};

export default function WebFrontendPage() {
    return (
        <div className="space-y-6">
            <WebFrontendManager />
        </div>
    );
}
