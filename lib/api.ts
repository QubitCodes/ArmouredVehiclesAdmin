import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { authService } from "@/services/admin/auth.service";
import { vendorAuthService } from "@/services/vendor/auth.service";
import { toast } from "sonner";
import Cookies from "js-cookie";

// Standard API Response Interface
export interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  code: number;
  data: T;
  misc?: any;
  errors?: any[];
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper function to determine which auth service to use
function getAuthService(url?: string) {
  if (typeof window !== 'undefined') {
    // 1. Check URL Context (Strongest Indicator)
    if (window.location.pathname.startsWith('/vendor')) {
      return vendorAuthService;
    }

    // 2. Check LocalStorage for Vendor
    const vendorUserStr = localStorage.getItem('vendor_user_details');
    if (vendorUserStr) {
      return vendorAuthService;
    }

    // 3. Check Cookie for Vendor
    if (Cookies.get("vendor_access_token")) {
      return vendorAuthService;
    }

    // 4. Fallback to Admin (Default)
    return authService;
  }

  return authService;
}

// Request interceptor to add access token to requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authService = getAuthService(config.url);
    const token = authService.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData - browser will set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh on 401 errors
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: string | null) => void;
  reject: (error?: AxiosError) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401
    if (error.response?.status === 401) {
      // 1. If we haven't retried yet, try to refresh
      if (!originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return api(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const authService = getAuthService(originalRequest.url);
          const newToken = await authService.refreshAccessToken();

          if (newToken) {
            processQueue(null, newToken);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return api(originalRequest);
          } else {
            console.error("[AuthDebug] Refresh returned no token. Redirecting.");
            // Refresh failed (soft)
            processQueue(error, null);
            if (typeof window !== "undefined") {
              authService.clearTokens();
              const isVendorPath = window.location.pathname.startsWith("/vendor");
              window.location.href = isVendorPath ? "/vendor/login" : "/admin/login";
            }
            return Promise.reject(error);
          }
        } catch (refreshError) {
          console.error("[AuthDebug] Refresh error catch:", refreshError);
          // Refresh failed (hard)
          processQueue(refreshError as AxiosError, null);
          if (typeof window !== "undefined") {
            const authService = getAuthService(originalRequest.url); // Re-get auth service safe ref
            authService.clearTokens();
            const isVendorPath = window.location.pathname.startsWith("/vendor");
            window.location.href = isVendorPath ? "/vendor/login" : "/admin/login";
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // 2. We ALREADY retried (originalRequest._retry is true), and it failed AGAIN with 401.
        // This is the "twice" condition.
        if (typeof window !== "undefined") {
          const authService = getAuthService(originalRequest.url);
          authService.clearTokens();
          const isVendorPath = window.location.pathname.startsWith("/vendor");
          window.location.href = isVendorPath ? "/vendor/login" : "/admin/login";
        }
        return Promise.reject(error);
      }
    }

    // Common Error Handling
    const errorMessage = (error.response?.data as any)?.message || error.message || "Something went wrong";
    // We can toast here optionally, or let the component handle it.
    // Given the user request "implement a common error handling", doing it here handles it globally.
    // However, some flows might want to suppress it.
    // For now, let's attach a normalized error object.

    return Promise.reject(error);
  }
);

export default api;

