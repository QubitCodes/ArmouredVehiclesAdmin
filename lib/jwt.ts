/**
 * Utility functions for JWT token decoding
 */

/**
 * Decode a JWT token and return the payload
 * Note: This only decodes the token, it does not verify the signature
 */
export function decodeJWT(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded);
  } catch (error) {
    console.error("Error decoding JWT:", error);
    return null;
  }
}

/**
 * Get vendor ID from JWT token
 */
export function getVendorIdFromToken(token: string | null): string | number | null {
  if (!token) return null;

  const decoded = decodeJWT(token);
  if (!decoded) return null;

  // Try common field names for user/vendor ID
  const vendorId = decoded.vendorId || decoded.vendor_id || decoded.userId || decoded.user_id || decoded.id || decoded.sub;
  
  if (typeof vendorId === "string" || typeof vendorId === "number") {
    return vendorId;
  }
  
  return null;
}

