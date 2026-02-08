'use client';

/**
 * RateCalculatorDialog Component
 * 
 * Allows admins to calculate shipping rates for an order manually.
 * Requires weight input and shows available FedEx services and their costs.
 * 
 * @module components/admin/order-management/RateCalculatorDialog
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { shipmentService, type Weight, type RateOption } from '@/services/admin/shipment.service';
import { toast } from 'sonner';
import { DollarSign, Package, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RateCalculatorDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog is closed */
    onClose: () => void;
    /** Order ID to calculate rates for */
    orderId: string;
    /** Currency of the order */
    orderCurrency?: string;
}

export function RateCalculatorDialog({
    open,
    onClose,
    orderId,
    orderCurrency = 'AED',
}: RateCalculatorDialogProps) {
    // State
    const [loading, setLoading] = useState(false);
    const [rates, setRates] = useState<RateOption[]>([]);
    const [weight, setWeight] = useState<Weight>({ units: 'KG', value: 1 });
    const [calculated, setCalculated] = useState(false);

    /**
     * Handle rate calculation
     */
    const handleCalculate = async () => {
        if (weight.value <= 0) {
            toast.error('Weight must be greater than 0');
            return;
        }

        setLoading(true);
        setCalculated(false);
        try {
            const results = await shipmentService.calculateOrderRates(orderId, weight);
            setRates(results);
            setCalculated(true);
            if (results.length === 0) {
                toast.info('No shipping options found for this destination');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to calculate rates');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        FedEx Rate Calculator
                    </DialogTitle>
                    <DialogDescription>
                        Calculate shipping costs based on package weight.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Weight Input */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Total Package Weight
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                min={0.1}
                                step={0.1}
                                value={weight.value}
                                onChange={(e) => setWeight({ ...weight, value: parseFloat(e.target.value) || 0 })}
                                className="flex-1"
                                placeholder="Enter weight..."
                            />
                            <Select
                                value={weight.units}
                                onChange={(e) => setWeight({ ...weight, units: e.target.value as 'KG' | 'LB' })}
                                className="w-24"
                            >
                                <option value="KG">KG</option>
                                <option value="LB">LB</option>
                            </Select>
                            <Button onClick={handleCalculate} disabled={loading}>
                                {loading ? <Spinner size="sm" /> : 'Calculate'}
                            </Button>
                        </div>
                    </div>

                    {/* Results */}
                    {calculated && (
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                                Available Services
                            </Label>
                            {rates.length > 0 ? (
                                <div className="grid gap-3">
                                    {rates.map((rate, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-foreground">{rate.serviceName}</span>
                                                {rate.deliveryDate && (
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <Truck className="h-3 w-3" />
                                                        Delivery by {new Date(rate.deliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="text-base font-bold text-primary">
                                                    {rate.currency} {rate.totalCharge.toFixed(2)}
                                                </span>
                                                {rate.transitDays && (
                                                    <p className="text-[10px] text-muted-foreground">{rate.transitDays} days transit</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 gap-2 text-center bg-muted/20 rounded-lg border border-dashed">
                                    <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                                    <p className="text-sm text-muted-foreground">No rates found for this configuration.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
