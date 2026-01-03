import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { authService } from "@/services/admin/auth.service";
import { vendorAuthService } from "@/services/vendor/auth.service";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper function to determine which auth service to use based on URL
function getAuthService(url?: string) {
  if (!url) return authService; // Default to admin
  
  // Check if the URL is for vendor endpoints
  const isVendorEndpoint = url.includes("/vendor/") || url.startsWith("/vendor");
  return isVendorEndpoint ? vendorAuthService : authService;
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
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
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
          processQueue(error, null);
          // Redirect to login if refresh fails
          if (typeof window !== "undefined") {
            const isVendorEndpoint = originalRequest.url?.includes("/vendor/") || originalRequest.url?.startsWith("/vendor");
            window.location.href = isVendorEndpoint ? "/vendor/login" : "/admin/login";
          }
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        // Redirect to login if refresh fails
        if (typeof window !== "undefined") {
          const isVendorEndpoint = originalRequest.url?.includes("/vendor/") || originalRequest.url?.startsWith("/vendor");
          window.location.href = isVendorEndpoint ? "/vendor/login" : "/admin/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

