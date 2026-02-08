/**
 * Shipment Service
 * 
 * Provides methods for interacting with FedEx shipment APIs
 * including rate calculation, pickup scheduling, and tracking.
 * 
 * @module services/admin/shipment.service
 */

import api from '@/lib/api';

/**
 * FedEx Address structure
 */
export interface FedExAddress {
    streetLines: string[];
    city: string;
    stateOrProvinceCode: string;
    postalCode: string;
    countryCode: string;
}

/**
 * FedEx Contact structure
 */
export interface FedExContact {
    personName: string;
    phoneNumber: string;
    emailAddress?: string;
    companyName?: string;
}

/**
 * Weight structure
 */
export interface Weight {
    units: 'KG' | 'LB';
    value: number;
}

/**
 * Dimensions structure
 */
export interface Dimensions {
    length: number;
    width: number;
    height: number;
    units: 'CM' | 'IN';
}

/**
 * Rate request parameters
 */
export interface RateRequestParams {
    fromAddress: FedExAddress;
    fromContact: FedExContact;
    toAddress: FedExAddress;
    toContact: FedExContact;
    weight: Weight;
    dimensions?: Dimensions;
    shipDate?: string;
}

/**
 * Pickup scheduling parameters
 */
export interface SchedulePickupParams {
    orderId: string;
    pickupDate: string;  // YYYY-MM-DD
    readyTime: string;   // HH:MM
    closeTime: string;   // HH:MM
    packageCount?: number;
    weight: Weight;
}

/**
 * Rate response item
 */
export interface RateOption {
    serviceType: string;
    serviceName: string;
    totalCharge: number;
    currency: string;
    deliveryDate?: string;
    transitDays?: number;
}

/**
 * Pickup confirmation response
 */
export interface PickupConfirmation {
    confirmationCode: string;
    pickupDate: string;
    readyTime: string;
    closeTime: string;
    location: string;
}

/**
 * Shipment response
 */
export interface ShipmentResponse {
    trackingNumber: string;
    shipmentId: string;
    labelUrl: string;
}

/**
 * Tracking event
 */
export interface TrackingEvent {
    timestamp: string;
    description: string;
    location?: string;
    status: string;
}

/**
 * Tracking info response
 */
export interface TrackingInfo {
    trackingNumber: string;
    status: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
    events: TrackingEvent[];
}

/**
 * Shipment settings
 */
export interface ShipmentSettings {
    handle_vendor_shipment: boolean;
    handle_return_shipment: boolean;
    vendor_shipment_pay: 'vendor' | 'admin';
    return_shipment_pay: 'admin' | 'customer';
}

/**
 * FedEx availability status
 */
export interface FedExAvailability {
    configured: boolean;
    valid: boolean;
}

/**
 * Shipment Service class
 */
class ShipmentService {
    /**
     * Check if FedEx is configured and available
     */
    async checkAvailability(): Promise<FedExAvailability> {
        try {
            const response = await api.get<{ status: boolean; data: FedExAvailability }>(
                '/shipment/availability'
            );
            return response.data.data;
        } catch (error) {
            console.error('Error checking FedEx availability:', error);
            return { configured: false, valid: false };
        }
    }

    /**
     * Get available pickup dates
     */
    async getPickupDates(): Promise<string[]> {
        try {
            const response = await api.get<{ status: boolean; data: { dates: string[] } }>(
                '/shipment/pickup-dates'
            );
            return response.data.data.dates;
        } catch (error) {
            console.error('Error fetching pickup dates:', error);
            return [];
        }
    }

    /**
     * Calculate shipping rates
     */
    async calculateRates(params: RateRequestParams): Promise<RateOption[]> {
        try {
            const response = await api.post<{ status: boolean; data: { rates: RateOption[] } }>(
                '/shipment/rate',
                params
            );
            return response.data.data.rates;
        } catch (error) {
            console.error('Error calculating rates:', error);
            throw error;
        }
    }

    /**
     * Calculate shipping rates for a specific order
     */
    async calculateOrderRates(orderId: string, weight: Weight): Promise<RateOption[]> {
        try {
            const response = await api.post<{ status: boolean; data: { rates: RateOption[] } }>(
                `/shipment/rate/order/${orderId}`,
                { weight }
            );
            return response.data.data.rates;
        } catch (error) {
            console.error('Error calculating order rates:', error);
            throw error;
        }
    }

    /**
     * Schedule a FedEx pickup
     */
    async schedulePickup(params: SchedulePickupParams): Promise<{
        shipment: ShipmentResponse;
        pickup?: PickupConfirmation;
        order_status: string;
    }> {
        try {
            const response = await api.post<{
                status: boolean;
                data: {
                    shipment: ShipmentResponse;
                    pickup?: PickupConfirmation;
                    order_status: string;
                };
            }>('/shipment/schedule-pickup', params);
            return response.data.data;
        } catch (error: any) {
            console.error('Error scheduling pickup:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to schedule pickup');
        }
    }

    /**
     * Track a shipment by tracking number
     */
    async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
        try {
            const response = await api.get<{ status: boolean; data: TrackingInfo }>(
                `/shipment/track/${trackingNumber}`
            );
            return response.data.data;
        } catch (error) {
            console.error('Error tracking shipment:', error);
            throw error;
        }
    }

    /**
     * Track shipment for a specific order
     */
    async trackOrderShipment(orderId: string): Promise<TrackingInfo & { order_id: string; order_number: string }> {
        try {
            const response = await api.get<{
                status: boolean;
                data: TrackingInfo & { order_id: string; order_number: string };
            }>(`/shipment/order/${orderId}/track`);
            return response.data.data;
        } catch (error) {
            console.error('Error tracking order shipment:', error);
            throw error;
        }
    }

    /**
     * Get shipment-related platform settings
     */
    async getSettings(): Promise<ShipmentSettings> {
        try {
            const response = await api.get<{ status: boolean; data: ShipmentSettings }>(
                '/shipment/settings'
            );
            return response.data.data;
        } catch (error) {
            console.error('Error fetching shipment settings:', error);
            throw error;
        }
    }
}

export const shipmentService = new ShipmentService();
