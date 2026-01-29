
import api from "@/lib/api";

export interface UploadResponse {
    success: boolean;
    data: string[]; // Array of file paths
    message: string;
}

class UploadService {
    /**
     * Upload a file to the simplified UploadHandler endpoint
     */
    async uploadFile(file: File, label: string, data?: any, updateDb: boolean = false): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append('files', file);
        formData.append('label', label);
        if (data) {
            formData.append('data', JSON.stringify(data));
        }
        formData.append('updateDb', String(updateDb));

        const response = await api.post<UploadResponse>('/upload/files', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
}

export const uploadService = new UploadService();
