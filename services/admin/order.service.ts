import api from "@/lib/api";

export interface Order {
  id: string;
  user_id: string;
  tracking_number?: string | null;
  order_status?: string;
  total_amount?: number | string | null;
  currency?: string;
  payment_status?: string | null;
  shipment_status?: string | null;
  created_at?: string | null;
  updated_at?: string;
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
  statusHistory?: StatusHistoryItem[];
}

export interface StatusHistoryItem {
  id: number;
  orderId: string;
  status: string;
  changedBy: string;
  note?: string | null;
  createdAt: string;
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
        params,
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
      throw error;
    }
  }
}

export const orderService = new OrderService();

