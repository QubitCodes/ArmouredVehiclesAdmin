"use client";

import { useEffect, useState } from "react";
import { financeService } from "@/services/vendor/finance.service";
import { OverviewStats } from "@/components/vendor/wallet/overview-stats";
import { RecentTransactions } from "@/components/vendor/wallet/recent-transactions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default function VendorWalletPage() {
    const [stats, setStats] = useState({ balance: "0", locked_balance: "0", currency: "AED" });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [balanceRes, txRes] = await Promise.all([
                financeService.getWalletBalance(),
                financeService.getTransactions({ limit: 10 })
            ]);

            if (balanceRes.success) {
                setStats(balanceRes.data);
            }
            if (txRes.success) {
                setTransactions(txRes.data);
            }
        } catch (error) {
            console.error("Failed to load wallet data", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>
                <Button variant="outline" onClick={loadData}>Refresh</Button>
            </div>

            <OverviewStats stats={stats} onPayoutRequested={loadData} />

            <Tabs defaultValue="transactions" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    {/* Vendors might want to see Payout Status tab too? Optional */}
                </TabsList>
                <TabsContent value="transactions" className="space-y-4">
                    <RecentTransactions transactions={transactions} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
