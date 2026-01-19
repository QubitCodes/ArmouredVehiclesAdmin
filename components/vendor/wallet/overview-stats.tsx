"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Lock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { financeService } from "@/services/vendor/finance.service";
import { toast } from "sonner"; // Assuming sonner or use-toast is configured

interface WalletStats {
    balance: string;
    locked_balance: string;
    currency: string;
}

export function OverviewStats({ stats, onPayoutRequested }: { stats: WalletStats, onPayoutRequested: () => void }) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleRequestPayout = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }
        if (Number(amount) > Number(stats.balance)) {
             toast.error("Insufficient balance");
             return;
        }

        try {
            setSubmitting(true);
            await financeService.requestPayout(Number(amount));
            toast.success("Payout requested successfully");
            setIsDialogOpen(false);
            setAmount("");
            onPayoutRequested();
        } catch (error) {
            toast.error("Failed to request payout");
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.currency} {Number(stats.balance).toFixed(2)}
                    </div>
                    <div className="mt-4">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="w-full">
                                    <CreditCard className="mr-2 h-4 w-4" /> Request Payout
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Request Payout</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Amount</label>
                                        <Input 
                                            type="number" 
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Available: {stats.currency} {Number(stats.balance).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleRequestPayout} disabled={submitting}>
                                        {submitting ? "Processing..." : "Submit Request"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Locked Balance</CardTitle>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                         {stats.currency} {Number(stats.locked_balance).toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Funds in return period
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
