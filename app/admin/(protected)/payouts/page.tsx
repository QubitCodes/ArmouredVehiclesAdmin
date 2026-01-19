"use client";

import { useEffect, useState } from "react";
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
import { Select } from "@/components/ui/select";
import { financeService } from "@/services/admin/finance.service";
import { PayoutDetailsModal } from "@/components/admin/payouts/PayoutDetailsModal";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

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

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
};

export default function AdminPayoutsPage() {
    const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const loadPayouts = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (statusFilter !== "all") {
                params.status = statusFilter;
            }
            const res = await financeService.getPayoutRequests(params);
            if (res.status) {
                setPayouts(res.data || []);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load payout requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPayouts();
    }, [statusFilter]);

    const handleRowClick = (payout: PayoutRequest) => {
        setSelectedPayout(payout);
        setIsDetailsOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Payout Requests</h1>
                <Button variant="outline" onClick={loadPayouts} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <div className="w-48">
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        placeholder="Filter by status"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="paid">Paid</option>
                        <option value="rejected">Rejected</option>
                    </Select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Requested</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Transaction Ref</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : payouts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No payout requests found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            payouts.map((payout) => (
                                <TableRow key={payout.id} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell>
                                        <div>{payout.user?.name || 'N/A'}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {payout.user?.email || ''}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        AED {Number(payout.amount).toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(payout.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={statusColors[payout.status]}>
                                            {payout.status.toUpperCase()}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {payout.transaction_reference || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleRowClick(payout)}
                                        >
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Details Modal */}
            <PayoutDetailsModal
                payout={selectedPayout}
                open={isDetailsOpen}
                onOpenChange={setIsDetailsOpen}
                onUpdate={loadPayouts}
            />
        </div>
    );
}
