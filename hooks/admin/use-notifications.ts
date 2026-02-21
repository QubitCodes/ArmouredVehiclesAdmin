import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService, NotificationCounts, NotificationItem } from '@/services/admin/notification.service';

/**
 * Hook: Notification unread counts with 30-second polling.
 * Returns category-wise counts + total.
 */
export function useNotificationCounts(enabled: boolean = true) {
	return useQuery<NotificationCounts>({
		queryKey: ['notification-counts'],
		queryFn: () => notificationService.getCounts(),
		refetchInterval: 30_000, // Poll every 30 seconds
		refetchIntervalInBackground: false,
		enabled,
	});
}

/**
 * Hook: Paginated notification list.
 * Fetches when `enabled` is true (e.g. when dropdown is open).
 */
export function useNotifications(enabled: boolean = false, params?: { category?: string; page?: number; limit?: number }) {
	return useQuery<{ rows: NotificationItem[]; count: number }>({
		queryKey: ['notifications', params],
		queryFn: () => notificationService.getNotifications({ ...params, limit: params?.limit ?? 10 }),
		enabled,
	});
}

/**
 * Hook: Mark specific notifications as read.
 */
export function useMarkAsRead() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (ids: string[]) => notificationService.markAsRead(ids),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
			queryClient.invalidateQueries({ queryKey: ['notifications'] });
		},
	});
}

/**
 * Hook: Mark all notifications as read.
 */
export function useMarkAllAsRead() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (category?: string) => notificationService.markAllAsRead(category),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
			queryClient.invalidateQueries({ queryKey: ['notifications'] });
		},
	});
}

/**
 * Hook: Mark notifications as read by entity type + entity ID.
 * Useful when navigating directly to an entity page (e.g. order detail).
 * Invalidates counts + list after success.
 */
export function useMarkReadByEntity() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ entityType, entityId }: { entityType: string; entityId: string }) =>
			notificationService.markReadByEntity(entityType, entityId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
			queryClient.invalidateQueries({ queryKey: ['notifications'] });
		},
	});
}
