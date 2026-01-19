
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

    createSlider: async (data: FormData) => {
        const res = await api.post('/admin/web-frontend/sliders', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },

    updateSlider: async (id: string, data: FormData) => {
        const res = await api.put(`/admin/web-frontend/sliders/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },

    deleteSlider: async (id: string) => {
        const res = await api.delete(`/admin/web-frontend/sliders/${id}`);
        return res.data;
    },

    // Ads
    getAds: async (location?: string) => {
        const url = location ? `/admin/web-frontend/ads?location=${location}` : '/admin/web-frontend/ads';
        const res = await api.get(url);
        return res.data.data;
    },

    createAd: async (data: FormData) => {
        const res = await api.post('/admin/web-frontend/ads', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },

    updateAd: async (id: string, data: FormData) => {
        const res = await api.put(`/admin/web-frontend/ads/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },

    deleteAd: async (id: string) => {
        const res = await api.delete(`/admin/web-frontend/ads/${id}`);
        return res.data;
    }
};
