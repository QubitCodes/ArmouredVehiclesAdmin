import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { financeService } from "@/services/admin/finance.service";
import { authService } from "@/services/admin/auth.service";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PayoutRequest {
    id: string;
    amount: string;
    status: string;
    created_at: string;
    user: {
        name: string;
        email: string;
    };
}

interface WalletStats {
    balance: string;
    locked_balance: string;
    currency: string;
}

interface PayoutRequestsProps {
    stats: WalletStats;
    onPayoutRequested?: () => void;
    myRequestsOnly?: boolean;
}

export function PayoutRequests({ stats, onPayoutRequested, myRequestsOnly = false }: PayoutRequestsProps) {
    const [requests, setRequests] = useState<PayoutRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<PayoutRequest | null>(null);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);

    // Approval Form
    const [txRef, setTxRef] = useState("");
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    // Rejection Form
    const [rejectReason, setRejectReason] = useState("");

    // Request Payout Form
    const [isRequestPayoutOpen, setIsRequestPayoutOpen] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState("");

    // Vendor View Details
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Check if user is admin
    const userDetails = authService.getUserDetails();
    const isAdmin = userDetails?.userType === 'admin' || userDetails?.userType === 'super_admin';

    const loadRequests = async () => {
        try {
            setLoading(true);
            const res = await financeService.getPayoutRequests({ status: 'pending' });
            if (res.status) {
                let data = res.data || [];
                // Filter to only current user's requests if myRequestsOnly is true
                if (myRequestsOnly && userDetails?.id) {
                    data = data.filter((req: PayoutRequest & { user_id?: string }) =>
                        req.user_id === userDetails.id || req.user?.email === userDetails.email
                    );
                }
                setRequests(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load payout requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleApprove = async () => {
        if (!selectedRequest) return;
        try {
            // Note: Service expects File | undefined for receipt
            await financeService.approvePayout(selectedRequest.id, txRef, receiptFile || undefined);
            toast.success("Payout approved");
            setIsApproveOpen(false);
            loadRequests();
        } catch (error) {
            toast.error("Failed to approve payout");
        }
    };

    const handleReject = async () => {
        if (!selectedRequest) return;
        try {
            await financeService.rejectPayout(selectedRequest.id, rejectReason);
            toast.success("Payout rejected");
            setIsRejectOpen(false);
            loadRequests();
        } catch (error) {
            toast.error("Failed to reject payout");
        }
    };

    const handleRequestPayout = async () => {
        const amount = parseFloat(payoutAmount);
        if (!amount || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        try {
            const res = await financeService.requestPayout(amount);
            if (res.status) {
                toast.success("Payout request submitted successfully");
                setIsRequestPayoutOpen(false);
                setPayoutAmount("");
                loadRequests();
            } else {
                toast.error(res.message || "Failed to submit payout request");
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to submit payout request");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Pending Requests</h3>
                <Button size="sm" onClick={() => setIsRequestPayoutOpen(true)}>Request Payout</Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {isAdmin && <TableHead>Vendor</TableHead>}
                            <TableHead>Amount</TableHead>
                            <TableHead>Requested At</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.map((req) => (
                            <TableRow key={req.id}>
                                {isAdmin && (
                                    <TableCell>
                                        <div>{req.user.name}</div>
                                        <div className="text-xs text-muted-foreground">{req.user.email}</div>
                                    </TableCell>
                                )}
                                <TableCell>${Number(req.amount).toFixed(2)}</TableCell>
                                <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{req.status}</Badge>
                                </TableCell>
                                {isAdmin ? (
                                    <TableCell className="flex gap-2">
                                        <Button size="sm" onClick={() => { setSelectedRequest(req); setIsApproveOpen(true); }}>
                                            Approve
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => { setSelectedRequest(req); setIsRejectOpen(true); }}>
                                            Reject
                                        </Button>
                                    </TableCell>
                                ) : (
                                    <TableCell>
                                        <Button size="sm" variant="outline" onClick={() => { setSelectedRequest(req); setIsDetailsOpen(true); }}>
                                            View Details
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                        {requests.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No pending requests.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Approve Dialog */}
            <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Approve Payout</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Transaction Reference</Label>
                            <Input value={txRef} onChange={e => setTxRef(e.target.value)} placeholder="e.g. ACH-12345" />
                        </div>
                        <div className="space-y-2">
                            <Label>Receipt (Optional)</Label>
                            <Input type="file" onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
                        <Button onClick={handleApprove}>Confirm Approval</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Payout</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Why is this rejected?" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleReject}>Reject Request</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Request Payout Dialog */}
            <Dialog open={isRequestPayoutOpen} onOpenChange={setIsRequestPayoutOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Payout</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 pt-4">
                        {/* Balance Info */}
                        <div className="rounded-lg bg-muted p-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Available Balance:</span>
                                <span className="font-semibold text-green-600">
                                    {stats.currency} {Number(stats.balance).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Locked Balance:</span>
                                <span className="font-semibold text-amber-600">
                                    {stats.currency} {Number(stats.locked_balance).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {Number(stats.locked_balance) > 0 && (
                            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                ⏳ {stats.currency} {Number(stats.locked_balance).toFixed(2)} is currently locked and will be unlocked after the return period (usually 10 days after shipment).
                            </p>
                        )}

                        <div className="space-y-2">
                            <Label>Amount ({stats.currency})</Label>
                            <Input
                                type="number"
                                value={payoutAmount}
                                onChange={e => setPayoutAmount(e.target.value)}
                                placeholder="Enter amount to withdraw"
                                min="1"
                                max={stats.balance}
                                step="0.01"
                            />
                            <p className="text-xs text-muted-foreground">
                                Maximum: {stats.currency} {Number(stats.balance).toFixed(2)}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRequestPayoutOpen(false)}>Cancel</Button>
                        <Button onClick={handleRequestPayout}>Submit Request</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Vendor View Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Payout Request Details</DialogTitle>
                    </DialogHeader>
                    {selectedRequest && (
                        <div className="space-y-4 pt-4">
                            <div className="rounded-lg bg-muted p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Amount:</span>
                                    <span className="font-semibold text-green-600">
                                        AED {Number(selectedRequest.amount).toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Requested:</span>
                                    <span>{new Date(selectedRequest.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between text-sm items-center">
                                    <span className="text-muted-foreground">Status:</span>
                                    <Badge variant="outline">{selectedRequest.status?.toUpperCase()}</Badge>
                                </div>
                            </div>

                            {(selectedRequest as any).admin_note && (
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Admin Note</Label>
                                    <p className="text-sm bg-muted p-3 rounded">{(selectedRequest as any).admin_note}</p>
                                </div>
                            )}

                            {(selectedRequest as any).transaction_reference && (
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Transaction Reference</Label>
                                    <p className="text-sm font-mono bg-green-50 text-green-700 p-3 rounded border border-green-200">
                                        {(selectedRequest as any).transaction_reference}
                                    </p>
                                </div>
                            )}

                            {(selectedRequest as any).receipt && (
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Receipt/Proof</Label>
                                    <p className="text-sm bg-muted p-3 rounded">{(selectedRequest as any).receipt}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setIsDetailsOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
