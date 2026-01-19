"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { financeService } from "@/services/admin/finance.service";
import { toast } from "sonner";

interface PayoutRequest {
    id: string;
    amount: string;
    status: 'pending' | 'approved' | 'paid' | 'rejected';
    admin_note?: string;
    receipt?: string;
    transaction_reference?: string;
    created_at: string;
    approved_at?: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    approver?: {
        name: string;
        email: string;
    };
}

interface PayoutDetailsModalProps {
    payout: PayoutRequest | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
};

export function PayoutDetailsModal({ payout, open, onOpenChange, onUpdate }: PayoutDetailsModalProps) {
    const [newStatus, setNewStatus] = useState<string>("");
    const [adminNote, setAdminNote] = useState("");
    const [transactionRef, setTransactionRef] = useState("");
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleStatusUpdate = async () => {
        if (!payout || !newStatus) return;

        // Validate fields for 'paid' status
        if (newStatus === 'paid' && !transactionRef) {
            toast.error("Transaction reference is required for paid status");
            return;
        }

        setLoading(true);
        try {
            const res = await financeService.updatePayoutStatus(
                payout.id,
                newStatus as 'approved' | 'paid' | 'rejected',
                adminNote || undefined,
                transactionRef || undefined,
                receiptFile || undefined
            );

            if (res.status) {
                toast.success(`Payout ${newStatus} successfully`);
                onUpdate();
                onOpenChange(false);
                // Reset form
                setNewStatus("");
                setAdminNote("");
                setTransactionRef("");
                setReceiptFile(null);
            } else {
                toast.error(res.message || "Failed to update payout");
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update payout");
        } finally {
            setLoading(false);
        }
    };

    if (!payout) return null;

    // Admins can change pending → approved/rejected/paid, or approved → paid
    const canChangeStatus = payout.status === 'pending' || payout.status === 'approved';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Payout Request Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Vendor Info */}
                    <div className="rounded-lg bg-muted p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Vendor:</span>
                            <span className="font-medium">{payout.user.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Email:</span>
                            <span>{payout.user.email}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="font-semibold text-green-600">
                                AED {Number(payout.amount).toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Requested:</span>
                            <span>{new Date(payout.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-muted-foreground">Status:</span>
                            <Badge className={statusColors[payout.status]}>
                                {payout.status.toUpperCase()}
                            </Badge>
                        </div>
                    </div>

                    {/* Existing Admin Note */}
                    {payout.admin_note && (
                        <div className="space-y-1">
                            <Label className="text-muted-foreground">Admin Note</Label>
                            <p className="text-sm bg-muted p-2 rounded">{payout.admin_note}</p>
                        </div>
                    )}

                    {/* Existing Transaction Ref */}
                    {payout.transaction_reference && (
                        <div className="space-y-1">
                            <Label className="text-muted-foreground">Transaction Reference</Label>
                            <p className="text-sm font-mono bg-muted p-2 rounded">{payout.transaction_reference}</p>
                        </div>
                    )}

                    {/* Status Change Section */}
                    {canChangeStatus && (
                        <>
                            <hr />
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label>Change Status</Label>
                                    <Select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        placeholder="Select new status"
                                    >
                                        {payout.status === 'pending' && (
                                            <>
                                                <option value="approved">Approved (Ready for payment)</option>
                                                <option value="paid">Paid (Mark as transferred)</option>
                                                <option value="rejected">Rejected</option>
                                            </>
                                        )}
                                        {payout.status === 'approved' && (
                                            <option value="paid">Paid (Mark as transferred)</option>
                                        )}
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Admin Comments</Label>
                                    <Textarea
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        placeholder="Add notes about this payout..."
                                        rows={2}
                                    />
                                </div>

                                {(newStatus === 'approved' || newStatus === 'paid') && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Transaction Reference {newStatus === 'paid' && <span className="text-red-500">*</span>}</Label>
                                            <Input
                                                value={transactionRef}
                                                onChange={(e) => setTransactionRef(e.target.value)}
                                                placeholder="e.g., TRX-123456"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Transaction Proof (Receipt)</Label>
                                            <Input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Upload proof of transfer (image or PDF)
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}

                    {!canChangeStatus && (
                        <p className="text-sm text-muted-foreground text-center py-2">
                            This payout has already been {payout.status}.
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                    {canChangeStatus && newStatus && (
                        <Button
                            onClick={handleStatusUpdate}
                            disabled={loading}
                            variant={newStatus === 'rejected' ? 'destructive' : 'default'}
                        >
                            {loading ? "Processing..." : `Mark as ${newStatus}`}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
