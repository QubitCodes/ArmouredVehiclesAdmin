import api from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api/v1";

export const financeService = {
  async getWalletBalance() {
    const res = await api.get('/finance/wallet');
    return res.data;
  },

  async getTransactions(params: any = {}) {
    // api.get handles query params via the 'params' option
    const res = await api.get('/finance/transactions', { params });
    return res.data;
  },

  async getPayoutRequests(params: any = {}) {
    const res = await api.get('/payouts', { params });
    return res.data;
  },

  async approvePayout(id: string, transactionId: string, receipt?: File) { // receipt needs to be File | undefined
    const formData = new FormData();
    if (transactionId) formData.append('transaction_reference', transactionId);
    if (receipt) formData.append('receipt', receipt);

    // Axios handles Multipart automatically when passing FormData
    const res = await api.post(`/payouts/${id}/approve`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  async rejectPayout(id: string, reason: string) {
    const res = await api.post(`/payouts/${id}/reject`, { adminNote: reason }); // Changed 'reason' to 'adminNote' to match backend PayoutController
    return res.data;
  },

  async triggerUnlockProcess() {
    // Placeholder for unlock process
    return { success: true, message: "Use Cron Job for now" };
  },

  /**
   * Request a payout (for vendors)
   */
  async requestPayout(amount: number) {
    const res = await api.post('/payouts/request', { amount });
    return res.data;
  },

  /**
   * Get a single payout request details
   */
  async getPayout(id: string) {
    const res = await api.get(`/payouts/${id}`);
    return res.data;
  },

  /**
   * Update payout status with admin note and optional transaction proof
   * Used by admin to approve/mark as paid/reject
   */
  async updatePayoutStatus(
    id: string,
    status: 'approved' | 'paid' | 'rejected',
    adminNote?: string,
    transactionReference?: string,
    receipt?: File
  ) {
    if (status === 'rejected') {
      const res = await api.post(`/payouts/${id}/reject`, { adminNote });
      return res.data;
    }

    if (status === 'approved') {
      // Approve only (no wallet debit, no receipt needed)
      const formData = new FormData();
      if (adminNote) formData.append('adminNote', adminNote);

      const res = await api.post(`/payouts/${id}/approve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data;
    }

    // For paid status (requires transaction reference, debits wallet)
    const formData = new FormData();
    if (adminNote) formData.append('adminNote', adminNote);
    if (transactionReference) formData.append('transactionReference', transactionReference);
    if (receipt) formData.append('receipt', receipt);

    const res = await api.post(`/payouts/${id}/pay`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};
