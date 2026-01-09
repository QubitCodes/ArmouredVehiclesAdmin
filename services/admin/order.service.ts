import api from "@/lib/api";

export interface Order {
  id: string;
  userId: string;
  orderNumber?: string;
  trackingNumber?: string | null;
  customerName?: string;
  customerEmail?: string;
  status?: string;
  total?: string;
  totalAmount?: number;
  estimatedDelivery?: string | null;
  createdAt: string;
  updatedAt?: string;
  items?: OrderItem[];
  shippingAddress?: string;
  paymentMethod?: string;
  user?: {
    id: string;
    name: string;
    username?: string;
    email: string;
    phone?: string;
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
}

export interface GetOrdersResponse {
  success: boolean;
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
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
    } catch (error) {
      console.error("Error fetching orders:", error);
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
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  }
}

export const orderService = new OrderService();

