"use client";

import { useEffect, useState, useId } from "react";
import { financeService } from "@/services/admin/finance.service";
import { OverviewStats } from "@/components/admin/wallet/overview-stats";
import { RecentTransactions } from "@/components/admin/wallet/recent-transactions";
import { PayoutRequests } from "@/components/admin/wallet/payout-requests";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default function AdminWalletPage() {
    const [stats, setStats] = useState({ balance: "0", locked_balance: "0", currency: "AED" });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const tabsId = useId();

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

            if (balanceRes && balanceRes.status) {
                setStats(balanceRes.data);
            }

            if (txRes && txRes.status) {
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
                <h1 className="text-3xl font-bold tracking-tight">Wallet & Payouts</h1>
                <Button variant="outline" onClick={loadData}>Refresh</Button>
            </div>

            <OverviewStats stats={stats} />

            <Tabs id={tabsId} defaultValue="transactions" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="payouts">Payout Requests</TabsTrigger>
                </TabsList>
                <TabsContent value="transactions" className="space-y-4">
                    <RecentTransactions transactions={transactions} />
                </TabsContent>
                <TabsContent value="payouts">
                    <PayoutRequests stats={stats} onPayoutRequested={loadData} myRequestsOnly={true} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
