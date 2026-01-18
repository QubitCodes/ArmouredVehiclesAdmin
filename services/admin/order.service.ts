import api from "@/lib/api";

export interface Order {
  id: string;
  order_id?: string;
  user_id: string;
  tracking_number?: string | null;
  order_status: "order_received" | "vendor_approved" | "vendor_rejected" | "approved" | "rejected" | "cancelled" | "processing" | "shipped" | "delivered" | "returned" | "Order Received" | "Pending Review" | "Approved" | "pending_review" | "pending_approval";
  total_amount: number;
  currency: string;
  type?: "direct" | "request"; // Added 'type' field, assuming it's optional based on other fields
  payment_status?: "pending" | "paid" | "failed" | "refunded" | null;
  shipment_status?: "pending" | "vendor_shipped" | "admin_received" | "processing" | "shipped" | "delivered" | "returned" | "cancelled" | null;
  comments?: string | null; // Added 'comments' field
  trackingNumber?: string; // Added 'trackingNumber' field
  estimatedDelivery?: string; // Added 'estimatedDelivery' field
  created_at: string | null; // Changed from 'created_at?' to 'created_at' and fixed type
  updated_at?: string;
  order_group_id?: string | null;
  vendor_id?: string | null;
  vat_amount?: number;
  admin_commission?: number;
  grouped_orders?: Order[];
  items?: OrderItem[];
  shipping_address?: string;
  payment_method?: string;
  transaction_details?: string | null;
  shipment_details?: string | null;
  user?: {
    id: string;
    name: string;
    username?: string;
    email: string;
    phone?: string;
    country_code?: string;
    user_type?: string;
  };
  status_history?: OrderStatusHistory[];
  status_summary?: string[]; // Array of statuses for grouped orders
  sub_order_count?: number;
  vendor?: {
    id: string;
    name: string;
    email: string;
    username: string;
  };
}

export interface OrderStatusHistory {
  note: string;
  status: string;
  timestamp: string;
  updated_by: string;
  payment_status: string | null;
  shipment_status: string | null;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  product?: {
    name: string;
    sku: string;
    featured_image?: string | null;
    base_price?: number | string | null;
    media?: { url: string }[];
  };
}

export interface GetOrdersResponse {
  success: boolean;
  data: Order[];
  misc?: {
    total: number;
    page: number;
    pages: number;
  };
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  vendorId?: string;
}

class OrderService {
  /**
   * Fetch list of orders from /admin/orders
   */
  async getOrders(params: GetOrdersParams = {}) {
    try {
      const response = await api.get<GetOrdersResponse>("/admin/orders", {
        params: {
            ...params,
            vendor_id: params.vendorId, // Map camelCase to snake_case
            vendorId: undefined // Remove camelCase to avoid duplication
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error fetching orders:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      throw error;
    }
  }

  /**
   * Fetch a single order by ID from /admin/orders/{orderId}
   */
  async getOrderById(orderId: string) {
    try {
      const response = await api.get<{ success: boolean; data: Order }>(`/admin/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching order:", {
        id: orderId,
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }
  /**
   * Update order status, payment status, or shipment status
   */
  async updateOrder(orderId: string, data: Partial<Order>) {
    try {
      const response = await api.patch<{ success: boolean; data: Order }>(`/admin/orders/${orderId}`, data);
      return response.data;
    } catch (error: any) {
      console.error("Error updating order:", {
        id: orderId,
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      // Throw the actual backend message if available
      throw new Error(error.response?.data?.message || error.message);
    }
  }
}

export const orderService = new OrderService();

