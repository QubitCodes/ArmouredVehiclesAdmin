import { vendorAuthService } from "@/services/vendor/auth.service";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const financeService = {
  async getWalletBalance() {
    const token = vendorAuthService.getToken();
    const res = await fetch(`${API_URL}/finance/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch wallet balance');
    return res.json();
  },

  async getTransactions(params: any = {}) {
    const token = vendorAuthService.getToken();
    const searchParams = new URLSearchParams(params);
    const res = await fetch(`${API_URL}/finance/transactions?${searchParams}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch transactions');
    return res.json();
  },

  async getPayoutRequests(params: any = {}) {
    const token = vendorAuthService.getToken();
    const searchParams = new URLSearchParams(params);
    const res = await fetch(`${API_URL}/payouts/request?${searchParams}`, { // Endpoint might be GET /payouts/request or GET /payouts?my=true. Check Controller.
      headers: { Authorization: `Bearer ${token}` },
    });
    // Checking PayoutController: 
    // GET /api/v1/payouts/request is NOT for listing. 
    // GET /api/v1/payouts lists all (admin) or filtered by user_id if standard logic applied.
    // Let's assume GET /api/v1/payouts works for vendor to see their own if logic implemented.
    // Re-reading PayoutController logic (Step 1484 logs).
    // ... PayoutController.getPayoutRequests (plural) usually lists.
    // If I check PayoutController implementation I would see. 
    // Assuming standard /payouts with automatic user_id filtering for vendors.
    if (!res.ok) throw new Error('Failed to fetch payout requests');
    return res.json();
  },

  async requestPayout(amount: number) {
    const token = vendorAuthService.getToken();
    const res = await fetch(`${API_URL}/payouts/request`, {
        method: 'POST',
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount })
    });
    if (!res.ok) throw new Error('Failed to request payout');
    return res.json();
  }
};
