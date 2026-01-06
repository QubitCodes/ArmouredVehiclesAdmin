import api from "@/lib/api";

export interface Product {
  id: string;
  name: string;
  description?: string;
  price?: number;
  basePrice?: number;
  status?: string;
  category?: string;
  mainCategory?: string;
  createdAt: string;
  updatedAt?: string;
  imageUrl?: string | null;
  stock?: number;
  sku?: string;
}

export interface CreateProductRequest {
  name: string;
  vendorId?: string | number;
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
  products?: Product[];
  total?: number;
  page?: number;
  limit?: number;
}

// API can return either an array directly or a wrapped response
export type ProductsResponse = Product[] | GetProductsResponse;

export interface GetProductsParams {
  page?: number;
  limit?: number;
}

class VendorProductService {
  /**
   * Fetch list of vendor's products from /vendor/products
   * API returns array directly: Product[]
   */
  async getProducts(params: GetProductsParams = {}) {
    try {
      const response = await api.get<Product[] | GetProductsResponse>("/vendor/products", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching vendor products:", error);
      throw error;
    }
  }

  /**
   * Fetch a single product by ID
   */
  async getProductById(id: string) {
    try {
      const response = await api.get(`/vendor/products/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching vendor product:", error);
      throw error;
    }
  }

  /**
   * Create a new product
   */
  async createProduct(data: CreateProductRequest) {
    try {
      const response = await api.post("/vendor/products", data);
      return response.data;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(id: string, data: UpdateProductRequest) {
    try {
      const response = await api.patch(`/vendor/products/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating product:", error);
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
}

export const vendorProductService = new VendorProductService();

