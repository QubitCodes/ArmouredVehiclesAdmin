import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Transaction {
    id: string;
    type: string;
    amount: string;
    status: string;
    description: string;
    created_at: string;
}

export function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((tx) => (
                        <TableRow key={tx.id}>
                            <TableCell>{format(new Date(tx.created_at), "MMM d, yyyy")}</TableCell>
                            <TableCell>{tx.description}</TableCell>
                            <TableCell className="capitalize">{tx.type.replace(/_/g, " ")}</TableCell>
                            <TableCell className={Number(tx.amount) > 0 ? "text-green-600" : "text-red-600"}>
                                {Number(tx.amount) > 0 ? "+" : ""}{Number(tx.amount).toFixed(2)}
                            </TableCell>
                            <TableCell>
                                <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                                    {tx.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                    {transactions.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                No transactions found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
