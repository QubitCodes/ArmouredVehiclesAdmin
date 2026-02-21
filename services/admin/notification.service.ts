import api, { ApiResponse } from '@/lib/api';

/**
 * Notification interfaces
 */
export interface NotificationItem {
	id: string;
	type: string;
	category: string;
	title: string;
	message: string;
	is_read: boolean;
	entity_type?: string;
	entity_id?: string;
	created_at: string;
	actor?: {
		id: string;
		name: string;
	};
}

export interface NotificationCounts {
	[category: string]: number;
}

/**
 * Notification Service
 * Handles all notification API calls for the admin panel.
 */
class NotificationService {
	/**
	 * Fetch paginated notifications for the authenticated user.
	 * @param params - Optional filters: category, is_read, page, limit
	 */
	async getNotifications(params?: {
		category?: string;
		is_read?: string;
		page?: number;
		limit?: number;
	}): Promise<{ rows: NotificationItem[]; count: number }> {
		const response = await api.get<ApiResponse<NotificationItem[]>>('/notifications', { params });
		const rows = response.data.data ?? [];
		const count = response.data.misc?.pagination?.total ?? rows.length;
		return { rows, count };
	}

	/**
	 * Fetch unread counts grouped by category.
	 * Returns e.g. { users: 3, orders: 1, total: 4 }
	 */
	async getCounts(): Promise<NotificationCounts> {
		const response = await api.get<ApiResponse<NotificationCounts>>('/notifications/counts');
		return response.data.data;
	}

	/**
	 * Mark specific notifications as read.
	 * @param ids - Array of notification UUIDs
	 */
	async markAsRead(ids: string[]): Promise<void> {
		await api.patch('/notifications/read', { ids });
	}

	/**
	 * Mark all notifications as read for the current user.
	 * @param category - Optional category scope
	 */
	async markAllAsRead(category?: string): Promise<void> {
		await api.patch('/notifications/read-all', { category });
	}

	/**
	 * Mark all notifications related to a specific entity as read.
	 * Called when the user opens an entity page directly (e.g. an order detail page).
	 * @param entityType - Entity type (e.g. 'order', 'product', 'user')
	 * @param entityId   - Entity UUID
	 */
	async markReadByEntity(entityType: string, entityId: string): Promise<void> {
		await api.patch('/notifications/read-by-entity', { entityType, entityId });
	}
}

export const notificationService = new NotificationService();
