
import api from "@/lib/api";

export interface FrontendSlider {
    id: string;
    image_url: string;
    title?: string;
    subtitle?: string;
    link?: string;
    button_text?: string;
    is_active: boolean;
    valid_till?: string;
    sort_order: number;
}

export interface FrontendAd {
    id: string;
    location: string;
    image_url?: string;
    title?: string;
    link?: string;
    is_active: boolean;
    valid_till?: string;
}

export const webFrontendService = {
    // Sliders
    getSliders: async () => {
        const res = await api.get('/admin/web-frontend/sliders');
        return res.data.data;
    },

    async createSlider(data: any) {
        const response = await api.post<FrontendSlider>('/admin/web-frontend/sliders', data);
        return response.data;
    },

    async updateSlider(id: string, data: any) {
        const response = await api.patch<FrontendSlider>(`/admin/web-frontend/sliders/${id}`, data);
        return response.data;
    },

    async deleteSlider(id: string) {
        const response = await api.delete(`/admin/web-frontend/sliders/${id}`);
        return response.data;
    },

    // Ads
    async getAds(params: { location?: string } = {}) {
        const response = await api.get<FrontendAd[]>('/admin/web-frontend/ads', { params });
        return response.data;
    },

    async createAd(data: any) {
        const response = await api.post<FrontendAd>('/admin/web-frontend/ads', data);
        return response.data;
    },

    async updateAd(id: string, data: any) {
        const response = await api.patch<FrontendAd>(`/admin/web-frontend/ads/${id}`, data);
        return response.data;
    },

    async deleteAd(id: string) {
        const response = await api.delete(`/admin/web-frontend/ads/${id}`);
        return response.data;
    }
};
