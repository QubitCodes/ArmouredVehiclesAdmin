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

export interface GetInvoiceResponse {
    status: boolean;
    message: string;
    data: Invoice;
}

class InvoiceService {
    /**
     * Get all invoices for an order
     */
    async getInvoicesByOrder(orderId: string): Promise<Invoice[]> {
        try {
            const response = await api.get<GetInvoicesResponse>(`/invoices/order/${orderId}`);
            return response.data.data || [];
        } catch (error: any) {
            console.error('Error fetching invoices:', {
                orderId,
                message: error.message,
                status: error.response?.status
            });
            throw error;
        }
    }

    /**
     * Get invoice by ID
     */
    async getInvoiceById(invoiceId: string): Promise<Invoice> {
        try {
            const response = await api.get<GetInvoiceResponse>(`/invoices/${invoiceId}`);
            return response.data.data;
        } catch (error: any) {
            console.error('Error fetching invoice:', {
                invoiceId,
                message: error.message,
                status: error.response?.status
            });
            throw error;
        }
    }

    /**
     * Get public invoice view URL
     */
    getPublicInvoiceUrl(invoice: Invoice): string {
        const adminUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3000');
        // Retrieve Web URL from env or default to localhost:3001
        const webUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3001';

        if (invoice.invoice_type === 'customer') {
            return `${webUrl}/invoices/view/${invoice.access_token}`;
        }
        return `${adminUrl}/invoice/view/${invoice.access_token}`;
    }

    /**
     * Get invoice HTML URL for printing (authenticated)
     */
    getInvoiceHtmlUrl(invoiceId: string): string {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
        return `${baseUrl}/api/v1/invoices/${invoiceId}/html`;
    }

    /**
     * Get local invoice view URL (for Admin panel viewing)
     */
    getLocalViewUrl(invoice: Invoice): string {
        return `/invoice/view/${invoice.access_token}`;
    }

    /**
     * Open invoice in new tab
     */
    openInvoice(invoice: Invoice): void {
        const url = this.getLocalViewUrl(invoice);
        window.open(url, '_blank');
    }

    /**
     * Copy invoice link to clipboard
     */
    async copyInvoiceLink(invoice: Invoice): Promise<boolean> {
        try {
            const url = this.getPublicInvoiceUrl(invoice);
            await navigator.clipboard.writeText(url);
            return true;
        } catch (error) {
            console.error('Failed to copy invoice link:', error);
            return false;
        }
    }
}

export const invoiceService = new InvoiceService();
