import api from "@/lib/api";

export interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
  basePrice?: number;
  base_price?: number;
  currency?: string;
  status?: string;
  approval_status?: string;
  category?: string;
  mainCategory?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
  image?: string | null;
  imageUrl?: string | null;
  stock?: number;
  sku?: string;
  is_featured?: boolean;
  is_top_selling?: boolean;
}

export interface CreateProductRequest {
  name: string;
  sku?: string;
  mainCategoryId?: number;
  categoryId?: number;
  subCategoryId?: number;
  vehicleCompatibility?: string;
  certifications?: string;
  countryOfOrigin?: string;
  controlledItemType?: string;
  dimensionLength?: number;
  dimensionWidth?: number;
  dimensionHeight?: number;
  dimensionUnit?: string;
  materials?: string[];
  features?: string[];
  performance?: string[];
  technicalDescription?: string;
  driveTypes?: string[];
  sizes?: string[];
  thickness?: string[];
  colors?: string[];
  weightValue?: number;
  weightUnit?: string;
  packingLength?: number;
  packingWidth?: number;
  packingHeight?: number;
  packingDimensionUnit?: string;
  packingWeight?: number;
  packingWeightUnit?: string;
  basePrice: number;
  currency?: string;
  stock?: number;
  minOrderQuantity?: number;
  condition?: string;
  make?: string;
  model?: string;
  year?: number;
  readyStockAvailable?: boolean;
  pricingTerms?: string[];
  productionLeadTime?: number;
  manufacturingSource?: string;
  manufacturingSourceName?: string;
  requiresExportLicense?: boolean;
  hasWarranty?: boolean;
  warrantyDuration?: number;
  warrantyDurationUnit?: string;
  warrantyTerms?: string;
  complianceConfirmed?: boolean;
  supplierSignature?: string;
  vehicleFitment?: string;
  specifications?: string;
  description?: string;
  warranty?: string;
  actionType?: string;
  isFeatured?: boolean;
  image?: string;
  gallery?: string[];
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface GetProductsResponse {
  status: boolean;
  data: Product[];
  message?: string;
  code?: number;
  misc?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  approval_status?: string;
  vendorId?: string;
  vendor_id?: string; // Add support for backend param style
}

class ProductService {
  /**
   * Fetch list of products from /admin/products
   */
  async getProducts(params: GetProductsParams = {}) {
    try {
      const { search, ...rest } = params;
      const response = await api.get<GetProductsResponse>("/admin/products", {
        params: {
          ...rest,
          search: search,
          approval_status: params.approval_status,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  }

  /**
   * Fetch a single product by ID
   */
  async getProductById(id: string) {
    try {
      const response = await api.get<{ success: boolean; data: Product }>(`/admin/products/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
  }

  /**
   * Create a new product
   */
  async createProduct(data: CreateProductRequest | FormData) {
    try {
      const response = await api.post("/products", data);
      return response.data;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(id: string, data: UpdateProductRequest | FormData) {
    try {
      const response = await api.patch(`/products/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  }

  /**
   * Update product status
   */
  async updateProductStatus(id: string, status: string) {
    try {
      const response = await api.patch(`/vendor/products/${id}`, { status });
      return response.data;
    } catch (error) {
      console.error("Error updating product status:", error);
      throw error;
    }
  }

  /**
   * Update product status (Admin - New Flow)
   */
  async adminApproveRejectProduct(id: string, approval_status: string, rejection_reason?: string) {
    try {
      const response = await api.patch(`/admin/products/${id}/approval`, {
        status: approval_status,
        rejection_reason,
      });
      return response.data;
    } catch (error) {
      console.error("Error approving/rejecting product:", error);
      throw error;
    }
  }

  /**
   * Update product status (Admin)
   */
  async adminUpdateProductStatus(id: string, approval_status: string) {
    try {
      const response = await api.patch(`/admin/products/${id}`, { 
        approval_status 
      });
      return response.data;
    } catch (error) {
      console.error("Error updating product status (admin):", error);
      throw error;
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string) {
    try {
      const response = await api.delete(`/vendor/products/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }

  /**
   * Fetch vendor products using filtering on main endpoint
   */
  async getVendorProducts(vendorId: string, params: GetProductsParams = {}) {
    try {
      const { search, ...rest } = params;
      const response = await api.get<GetProductsResponse>("/admin/products", {
        params: {
          ...rest,
          search,
          approval_status: params.approval_status,
          vendor_id: vendorId, // Backend expects vendor_id
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching vendor products:", error);
      throw error;
    }
  }

  async updateProductAttributes(id: string, attributes: { is_featured?: boolean; is_top_selling?: boolean }) {
    try {
      const response = await api.patch(`/admin/products/${id}/attributes`, attributes);
      return response.data;
    } catch (error) {
      console.error("Error updating product attributes:", error);
      throw error;
    }
  }
}

export const productService = new ProductService();