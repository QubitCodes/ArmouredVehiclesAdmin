'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, X } from 'lucide-react';

interface InvoiceCommentModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (comments: string | null) => Promise<void>;
    title?: string;
    description?: string;
    isLoading?: boolean;
}

/**
 * Modal for entering optional invoice comments when approving an order
 * Used by both Vendor and Admin when approving orders
 */
export function InvoiceCommentModal({
    open,
    onClose,
    onSubmit,
    title = 'Add Invoice Comments',
    description = 'Optionally add comments that will appear on the invoice.',
    isLoading = false
}: InvoiceCommentModalProps) {
    const [comments, setComments] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await onSubmit(comments.trim() || null);
            setComments('');
            onClose();
        } catch (error) {
            console.error('Failed to submit:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkip = async () => {
        setSubmitting(true);
        try {
            await onSubmit(null);
            setComments('');
            onClose();
        } catch (error) {
            console.error('Failed to submit:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!submitting && !isLoading) {
            setComments('');
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="sm:max-w-2xl bg-[#F0EBE3] border-none shadow-2xl p-8">
                <DialogHeader className="mb-6">
                    <DialogTitle className="flex items-center gap-3 text-2xl font-black font-orbitron uppercase tracking-wide">
                        <FileText className="h-6 w-6 text-[#3D4A26]" />
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-[#6D6255] text-lg font-medium">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 w-full my-6">
                    <Textarea
                        placeholder="Enter comments here (optional)..."
                        value={comments}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComments(e.target.value)}
                        disabled={submitting || isLoading}
                        className="min-h-[160px] w-full bg-[#EBE3D6] border-[#BDAA91] text-lg rounded-xl focus-visible:ring-[#3D4A26] resize-none p-4"
                    />
                    <p className="text-sm text-[#6D6255] font-medium tracking-tight">
                        These comments will be visible on the printed invoice.
                    </p>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-4 sm:justify-end items-center mt-4">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        disabled={submitting || isLoading}
                        className="text-lg font-orbitron uppercase tracking-widest px-8"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleSkip}
                        disabled={submitting || isLoading}
                        className="text-lg font-orbitron uppercase tracking-widest px-10 border-[#BDAA91] bg-white/50"
                    >
                        {submitting ? '...' : 'Skip & Approve'}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || isLoading}
                        className="text-lg font-orbitron uppercase tracking-widest py-6"
                    >
                        {submitting ? '...' : 'ADD & APPROVE'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default InvoiceCommentModal;
