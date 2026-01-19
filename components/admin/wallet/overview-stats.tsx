import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Lock, Clock } from "lucide-react";

interface WalletStats {
    balance: string;
    locked_balance: string;
    currency: string;
}

export function OverviewStats({ stats }: { stats: WalletStats }) {
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
                    <p className="text-xs text-muted-foreground">
                        Ready for payout
                    </p>
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
            {/* 
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        $0.00
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Requests awaiting approval
                    </p>
                </CardContent>
            </Card>
            */}
        </div>
    );
}
