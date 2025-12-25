/**
 * Authentication service for managing tokens
 */

import Cookies from "js-cookie";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// Cookie options for secure token storage
const cookieOptions = {
  secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
  sameSite: "strict" as const, // CSRF protection
  path: "/", // Available across the entire site
};

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
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
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

      const data = await response.json();
      
      // Assuming the API returns { accessToken, refreshToken } or similar
      // Adjust based on your API response structure
      if (data.accessToken) {
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
}

export const authService = new AuthService();

