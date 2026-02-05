import api from '@/lib/api';

/**
 * Invoice interface matching backend model
 */
export interface Invoice {
    id: string;
    invoice_number: string;
    order_id: string;
    invoice_type: 'admin' | 'customer';

    addressee_name: string;
    addressee_address: string;
    addressee_phone?: string | null;
    addressee_email?: string | null;

    issuer_name: string;
    issuer_address: string;
    issuer_logo_url?: string | null;
    issuer_phone?: string | null;
    issuer_email?: string | null;

    subtotal: number;
    vat_amount: number;
    shipping_amount: number;
    packing_amount: number;
    total_amount: number;
    currency: string;

    comments?: string | null;
    terms_conditions?: string | null;
    payment_status: 'unpaid' | 'paid';
    access_token: string;

    created_at: string;
    updated_at: string;
}

export interface GetInvoicesResponse {
    status: boolean;
    message: string;
    data: Invoice[];
}

class VendorInvoiceService {
    /**
     * Get all invoices for an order (vendor sees only admin invoices)
     */
    async getInvoicesByOrder(orderId: string): Promise<Invoice[]> {
        try {
            const response = await api.get<GetInvoicesResponse>(`/invoices/order/${orderId}`);
            return response.data.data || [];
        } catch (error: unknown) {
            console.error('Error fetching invoices:', {
                orderId,
                message: (error as Error).message
            });
            throw error;
        }
    }

    /**
     * Get public invoice view URL
     */
    getPublicInvoiceUrl(accessToken: string): string {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3000');
        return `${baseUrl}/invoice/view/${accessToken}`;
    }

    /**
     * Open invoice in new tab
     */
    openInvoice(invoice: Invoice): void {
        const url = this.getPublicInvoiceUrl(invoice.access_token);
        window.open(url, '_blank');
    }

    /**
     * Copy invoice link to clipboard
     */
    async copyInvoiceLink(invoice: Invoice): Promise<boolean> {
        try {
            const url = this.getPublicInvoiceUrl(invoice.access_token);
            await navigator.clipboard.writeText(url);
            return true;
        } catch (error) {
            console.error('Failed to copy invoice link:', error);
            return false;
        }
    }
}

export const vendorInvoiceService = new VendorInvoiceService();
