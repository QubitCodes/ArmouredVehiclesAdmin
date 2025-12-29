import api from "@/lib/api";

export interface Order {
  id: string;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  status?: string;
  totalAmount?: number;
  createdAt: string;
  updatedAt?: string;
  items?: OrderItem[];
  shippingAddress?: string;
  paymentMethod?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface GetOrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface GetOrdersParams {
  page?: number;
  limit?: number;
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
}

export const orderService = new OrderService();

