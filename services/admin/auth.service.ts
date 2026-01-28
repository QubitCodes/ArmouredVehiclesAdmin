/**
 * Authentication service for managing tokens
 */

import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "admin_access_token";
const REFRESH_TOKEN_KEY = "admin_refresh_token";

// Cookie options for secure token storage
const cookieOptions = {
  secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
  sameSite: "strict" as const, // CSRF protection
  path: "/", // Available across the entire site
};

interface TokenResponse {
  status: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken?: string;
  };
}

class AuthService {
  /**
   * Get the stored access token
   */
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return Cookies.get(ACCESS_TOKEN_KEY) || null;
  }

  /**
   * Get the stored refresh token
   */
  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return Cookies.get(REFRESH_TOKEN_KEY) || null;
  }

  /**
   * Store access token
   */
  setAccessToken(token: string): void {
    if (typeof window === "undefined") return;
    Cookies.set(ACCESS_TOKEN_KEY, token, cookieOptions);
  }

  /**
   * Store refresh token
   */
  setRefreshToken(token: string): void {
    if (typeof window === "undefined") return;
    Cookies.set(REFRESH_TOKEN_KEY, token, cookieOptions);
  }

  /**
   * Store both tokens
   */
  setTokens(accessToken: string, refreshToken: string): void {
    this.setAccessToken(accessToken);
    this.setRefreshToken(refreshToken);
  }

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    if (typeof window === "undefined") return;
    Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
    Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
    Cookies.remove(ACCESS_TOKEN_KEY, { path: "/" });
    Cookies.remove(REFRESH_TOKEN_KEY, { path: "/" });
    localStorage.removeItem("admin_user_details");
  }

  /**
   * Store user details
   */
  setUserDetails(user: any): void {
      if (typeof window === "undefined") return;
      localStorage.setItem("admin_user_details", JSON.stringify(user));
  }

  /**
   * Get user details
   */
  getUserDetails(): any {
      if (typeof window === "undefined") return null;
      const str = localStorage.getItem("admin_user_details");
      return str ? JSON.parse(str) : null;
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return null;
    }

    try {
      // TODO: Replace with your actual refresh token endpoint
      // Ensure we use the full API URL including /v1 if configured in environment, otherwise append it
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
      const response = await fetch(
        `${baseUrl}/auth/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const responseBody: TokenResponse = await response.json();
      const data = responseBody.data;
      
      // Assuming the API returns { status: true, data: { accessToken, refreshToken } }
      if (data && data.accessToken) {
        this.setAccessToken(data.accessToken);
        
        // Update refresh token if provided
        if (data.refreshToken) {
          this.setRefreshToken(data.refreshToken);
        }
        
        return data.accessToken;
      }

      return null;
    } catch (error) {
      console.error("Error refreshing token:", error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Check if user has a specific permission
   */
  hasPermission(permission: string, allowVendor: boolean = false): boolean {
    const user = this.getUserDetails();
    if (!user) return false;

    if (user.userType === "super_admin") return true;
    if (user.userType === "vendor") return allowVendor;
    
    // Admin check
    if (user.userType === "admin") {
        return user.permissions?.includes(permission) || false;
    }

    return false;
  }
  /**
   * Check if user exists (backend)
   */
  async checkUserExists(identifier: string) {
    // We use a clean axios call or the interceptor one? 
    // Since we don't have a token, interceptor works fine (no token attached).
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";
    
    // Using fetch to avoid circular dependency if I import 'api' here (since 'api' imports 'authService')
    // Wait, 'api' imports 'authService'. If I import 'api' here, circular dependency.
    // So I must use fetch or raw axios.
    
    const response = await fetch(`${baseUrl}/auth/user-exists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier })
    });
    
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Failed to check user');
    }
    return data;
  }

  /**
   * Login with Firebase ID Token
   */
  async loginWithFirebase(idToken: string) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

      const response = await fetch(`${baseUrl}/auth/firebase/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken })
      });

      const data = await response.json();
      
      if (!response.ok) {
          throw new Error(data.message || 'Login failed');
      }

      if (data.success && data.data) {
          const { accessToken, refreshToken, user } = data.data;
          this.setTokens(accessToken, refreshToken);
          this.setUserDetails(user);
      }
      
      return data;
  }
}

export const authService = new AuthService();

