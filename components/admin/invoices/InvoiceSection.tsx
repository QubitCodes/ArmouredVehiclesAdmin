'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { FileText, ExternalLink, Copy, Check, AlertCircle } from 'lucide-react';
import { Invoice, invoiceService } from '@/services/admin/invoice.service';
import { toast } from 'sonner';

interface InvoiceSectionProps {
    orderId: string;
    userRole?: string | null;
    onError?: (error: string) => void;
}

/**
 * Component to display invoices associated with an order
 * Used in order details page to show admin and customer invoices
 */
export function InvoiceSection({ orderId, userRole, onError }: InvoiceSectionProps) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        const fetchInvoices = async () => {
            if (!orderId) return;

            setLoading(true);
            setError(null);

            try {
                const data = await invoiceService.getInvoicesByOrder(orderId);
                setInvoices(data);
            } catch (err: unknown) {
                const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load invoices';
                setError(errorMsg);
                onError?.(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchInvoices();
    }, [orderId, onError]);

    const handleOpenInvoice = (invoice: Invoice) => {
        invoiceService.openInvoice(invoice);
    };

    const handleCopyLink = async (invoice: Invoice) => {
        const success = await invoiceService.copyInvoiceLink(invoice);
        if (success) {
            setCopiedId(invoice.id);
            toast.success('Invoice link copied to clipboard');
            setTimeout(() => setCopiedId(null), 2000);
        } else {
            toast.error('Failed to copy link');
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number, currency: string) => {
        return `${currency} ${Number(amount).toFixed(2)}`;
    };

    if (loading) {
        return (
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        <FileText className="h-5 w-5 text-primary" />
                        Invoices
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Spinner size="lg" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        <FileText className="h-5 w-5 text-primary" />
                        Invoices
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>{error}</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (invoices.length === 0) {
        return (
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        <FileText className="h-5 w-5 text-primary" />
                        Invoices
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-muted-foreground py-4">
                        <AlertCircle className="h-4 w-4" />
                        <span>No invoices generated yet. Invoices are created when orders are approved.</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                    <FileText className="h-5 w-5 text-primary" />
                    Invoices
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice #</TableHead>
                            {userRole !== 'vendor' && <TableHead>Type</TableHead>}
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.map((invoice) => (
                            <TableRow key={invoice.id}>
                                <TableCell>
                                    <span className="font-medium">{invoice.invoice_number}</span>
                                </TableCell>
                                {userRole !== 'vendor' && (
                                    <TableCell>
                                        <Badge variant={invoice.invoice_type === 'admin' ? 'secondary' : 'default'}>
                                            {invoice.invoice_type === 'admin' ? 'Vendor → Admin' : 'Admin → Customer'}
                                        </Badge>
                                    </TableCell>
                                )}
                                <TableCell>
                                    <Badge variant={invoice.payment_status === 'paid' ? 'default' : 'outline'}
                                        className={invoice.payment_status === 'paid'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                        }
                                    >
                                        {invoice.payment_status.toUpperCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(invoice.total_amount, invoice.currency)}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {formatDate(invoice.created_at)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleOpenInvoice(invoice)}
                                            title="View Invoice"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleCopyLink(invoice)}
                                            title={copiedId === invoice.id ? 'Copied!' : 'Copy Link'}
                                        >
                                            {copiedId === invoice.id ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default InvoiceSection;
