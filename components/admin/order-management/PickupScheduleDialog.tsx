'use client';

/**
 * PickupScheduleDialog Component
 * 
 * Dialog for scheduling FedEx pickups when changing shipment status.
 * Allows selection of pickup date and time windows.
 * 
 * @module components/admin/order-management/PickupScheduleDialog
 */

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { shipmentService, type Weight } from '@/services/admin/shipment.service';
import { toast } from 'sonner';
import { Calendar, Clock, Package, Truck, AlertCircle } from 'lucide-react';

interface PickupScheduleDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when dialog is closed */
    onClose: () => void;
    /** Order ID to schedule pickup for */
    orderId: string;
    /** Current shipment status (determines flow type) */
    currentStatus: string;
    /** Target status after pickup scheduled */
    targetStatus: string;
    /** Callback after successful pickup scheduling */
    onSuccess: (result: {
        trackingNumber: string;
        labelUrl: string;
        pickupConfirmation?: string;
    }) => void;
    /** Default weight from order items */
    defaultWeight?: number;
    /** Default package count (e.g. 1) */
    defaultPackageCount?: number;
}

/**
 * Time options for pickup window
 */
const TIME_OPTIONS = [
    { value: '08:00', label: '08:00 AM' },
    { value: '09:00', label: '09:00 AM' },
    { value: '10:00', label: '10:00 AM' },
    { value: '11:00', label: '11:00 AM' },
    { value: '12:00', label: '12:00 PM' },
    { value: '13:00', label: '01:00 PM' },
    { value: '14:00', label: '02:00 PM' },
    { value: '15:00', label: '03:00 PM' },
    { value: '16:00', label: '04:00 PM' },
    { value: '17:00', label: '05:00 PM' },
    { value: '18:00', label: '06:00 PM' },
];

export function PickupScheduleDialog({
    open,
    onClose,
    orderId,
    currentStatus,
    targetStatus,
    onSuccess,
    defaultWeight = 1,
    defaultPackageCount = 1
}: PickupScheduleDialogProps) {
    // State
    const [loading, setLoading] = useState(false);
    const [checkingAvailability, setCheckingAvailability] = useState(true);
    const [fedexAvailable, setFedexAvailable] = useState(false);
    const [availableDates, setAvailableDates] = useState<string[]>([]);

    // Form state
    const [pickupDate, setPickupDate] = useState('');
    const [readyTime, setReadyTime] = useState('09:00');
    const [closeTime, setCloseTime] = useState('17:00');
    const [packageCount, setPackageCount] = useState(defaultPackageCount);
    const [weight, setWeight] = useState<Weight>({ units: 'KG', value: defaultWeight });

    /**
     * Check FedEx availability and load pickup dates on dialog open
     */
    useEffect(() => {
        if (open) {
            checkFedExAvailability();
            // Update defaults when opening
            setWeight({ units: 'KG', value: defaultWeight });
            setPackageCount(defaultPackageCount);
        }
    }, [open, defaultWeight, defaultPackageCount]);

    /**
     * Check if FedEx is configured and available
     */
    const checkFedExAvailability = async () => {
        setCheckingAvailability(true);
        try {
            const availability = await shipmentService.checkAvailability();
            setFedexAvailable(availability.configured && availability.valid);

            if (availability.configured && availability.valid) {
                const dates = await shipmentService.getPickupDates();
                setAvailableDates(dates);
                if (dates.length > 0) {
                    setPickupDate(dates[0]);
                }
            }
        } catch (error) {
            console.error('Error checking FedEx availability:', error);
            setFedexAvailable(false);
        } finally {
            setCheckingAvailability(false);
        }
    };

    /**
     * Handle pickup scheduling submission
     */
    const handleSubmit = async () => {
        // Validation
        if (!pickupDate) {
            toast.error('Please select a pickup date');
            return;
        }
        if (!readyTime || !closeTime) {
            toast.error('Please select pickup time window');
            return;
        }
        if (weight.value <= 0) {
            toast.error('Weight must be greater than 0');
            return;
        }

        setLoading(true);
        try {
            const result = await shipmentService.schedulePickup({
                orderId,
                pickupDate,
                readyTime,
                closeTime,
                packageCount,
                weight,
            });

            toast.success('Pickup scheduled! Status will update automatically when FedEx picks up.');
            onSuccess({
                trackingNumber: result.shipment.trackingNumber,
                labelUrl: result.shipment.labelUrl,
                pickupConfirmation: result.pickup?.confirmationCode,
            });
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to schedule pickup');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get dialog title based on flow type
     */
    /**
     * Get dialog title based on flow type
     */
    const getDialogTitle = () => {
        return 'Schedule Pickup';
    };

    /**
     * Get flow description
     */
    const getFlowDescription = () => {
        return 'FedEx will pick up the shipment. Status will update automatically when pickup occurs.';
    };

    /**
     * Format date for display
     */
    const formatDateLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        // Format as '09 Feb 2026, Tue'
        const datePart = date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
        const dayPart = date.toLocaleDateString('en-GB', { weekday: 'short' });
        return `${datePart}, ${dayPart}.`;
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        {getDialogTitle()}
                    </DialogTitle>
                </DialogHeader>

                {checkingAvailability ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <Spinner size="lg" className="text-primary" />
                        <p className="text-sm text-muted-foreground">Checking FedEx availability...</p>
                    </div>
                ) : !fedexAvailable ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <AlertCircle className="h-12 w-12 text-amber-500" />
                        <p className="text-center text-muted-foreground">
                            FedEx is not configured or credentials are invalid.
                            <br />
                            Please contact your administrator.
                        </p>
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="text-sm text-muted-foreground mb-4">
                            {getFlowDescription()}
                        </div>

                        <div className="space-y-4">
                            {/* Pickup Date */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Pickup Date
                                </Label>
                                <Select
                                    value={pickupDate}
                                    onChange={(e) => setPickupDate(e.target.value)}
                                    className="w-full"
                                >
                                    {availableDates.map((date) => (
                                        <option key={date} value={date}>
                                            {formatDateLabel(date)}
                                        </option>
                                    ))}
                                </Select>
                            </div>

                            {/* Time Window */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Ready Time
                                    </Label>
                                    <Select
                                        value={readyTime}
                                        onChange={(e) => setReadyTime(e.target.value)}
                                        className="w-full"
                                    >
                                        {TIME_OPTIONS.map((time) => (
                                            <option key={time.value} value={time.value}>
                                                {time.label}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Close Time</Label>
                                    <Select
                                        value={closeTime}
                                        onChange={(e) => setCloseTime(e.target.value)}
                                        className="w-full"
                                    >
                                        {TIME_OPTIONS.filter((t) => t.value > readyTime).map((time) => (
                                            <option key={time.value} value={time.value}>
                                                {time.label}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            </div>

                            {/* Package Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Package className="h-4 w-4" />
                                        Packages
                                    </Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={99}
                                        value={packageCount}
                                        onChange={(e) => setPackageCount(parseInt(e.target.value) || 1)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Weight ({weight.units})</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            min={0.1}
                                            step={0.1}
                                            value={weight.value}
                                            onChange={(e) => setWeight({ ...weight, value: parseFloat(e.target.value) || 0 })}
                                            className="flex-1"
                                        />
                                        <Select
                                            value={weight.units}
                                            onChange={(e) => setWeight({ ...weight, units: e.target.value as 'KG' | 'LB' })}
                                            className="w-20"
                                        >
                                            <option value="KG">KG</option>
                                            <option value="LB">LB</option>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button variant="outline" onClick={onClose} disabled={loading}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading ? (
                                    <>
                                        <Spinner size="sm" className="mr-2" />
                                        Scheduling...
                                    </>
                                ) : (
                                    <>
                                        <Truck className="h-4 w-4 mr-2" />
                                        Schedule Pickup
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
