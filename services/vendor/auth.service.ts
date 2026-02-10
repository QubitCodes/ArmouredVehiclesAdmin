/**
 * Authentication service for managing vendor tokens
 */

import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "vendor_access_token";
const REFRESH_TOKEN_KEY = "vendor_refresh_token";

// Cookie options for secure token storage
const cookieOptions = {
  secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
  sameSite: "strict" as const, // CSRF protection
  path: "/", // Available across the entire site
};

class VendorAuthService {
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
    localStorage.removeItem("vendor_user_details");
  }

  /**
   * Store user details
   */
  setUserDetails(user: any): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("vendor_user_details", JSON.stringify(user));
  }

  /**
   * Get user details
   */
  getUserDetails(): any {
    if (typeof window === "undefined") return null;
    const str = localStorage.getItem("vendor_user_details");
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
      // Use vendor-specific refresh endpoint
      // Try sending refresh token in body first (most common pattern)
      // Some APIs might expect it in Authorization header instead
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";
      console.log("[AuthDebug] Vendor refreshing token at:", `${baseUrl}/vendor/auth/refresh`);

      const response = await fetch(
        `${baseUrl}/vendor/auth/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Alternative: Some APIs expect refresh token in Authorization header
            // Uncomment if your API requires it:
            // "Authorization": `Bearer ${refreshToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to refresh token");
      }

      const responseBody = await response.json();
      const data = responseBody.data;

      // Assuming the API returns { accessToken, refreshToken } or similar
      // Adjust based on your API response structure
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
   * Request profile update (reset onboarding)
   */
  async requestProfileUpdate(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) return false;

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";
      const response = await fetch(`${baseUrl}/user/request-update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to request update");
      }
      return true;
    } catch (error) {
      console.error("Error requesting profile update:", error);
      throw error;
    }
  }
}

export const vendorAuthService = new VendorAuthService();

