'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useParams } from 'next/navigation';
import { Bell, X } from 'lucide-react';
import { useNotificationCounts, useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/admin/use-notifications';
import { cn } from '@/lib/utils';

/**
 * Test-user allow-list.
 * During the testing phase, only these emails (plus any email containing '+') see the bell.
 */
const TEST_EMAILS = [
	'saneercyd@gmail.com',
	'mail@iamjk.in',
	'sinusaneer@gmail.com',
	'info@blueweb2.com',
	'mail+vendor@iamjk.in',
	'mail+c@iamjk.in',
];

/**
 * Check if the current user is in the notification test cohort.
 */
function isNotificationTestUser(email?: string | null): boolean {
	if (!email) return false;
	const lower = email.toLowerCase().trim();
	if (TEST_EMAILS.includes(lower)) return true;
	if (lower.includes('+')) return true;
	return false;
}

/**
 * Format a relative timestamp, e.g. "2m ago", "3h ago", "1d ago".
 */
function timeAgo(dateStr: string): string {
	const now = Date.now();
	const date = new Date(dateStr).getTime();
	const diff = Math.max(0, now - date);
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return new Date(dateStr).toLocaleDateString();
}

/**
 * Category badge colour mapping.
 */
const CATEGORY_COLORS: Record<string, string> = {
	users: 'bg-blue-500/20 text-blue-400',
	products: 'bg-emerald-500/20 text-emerald-400',
	orders: 'bg-amber-500/20 text-amber-400',
	shipping: 'bg-purple-500/20 text-purple-400',
	finance: 'bg-rose-500/20 text-rose-400',
	system: 'bg-gray-500/20 text-gray-400',
	reviews: 'bg-cyan-500/20 text-cyan-400',
};

interface NotificationBellProps {
	/** Current user's email for test-user gating */
	email?: string | null;
}

/**
 * Notification Bell component for the admin/vendor sidebar.
 * Renders a bell icon next to the logo.
 * Clicking opens a panel that slides out from UNDER the sidebar.
 * Uses createPortal to render the panel at document.body level
 * so it sits below the sidebar's stacking context.
 */
export function NotificationBell({ email }: NotificationBellProps) {
	const router = useRouter();
	const params = useParams();
	const domain = (params?.domain as string) || 'admin';

	/**
	 * Two-phase animation state:
	 * - showPanel: controls DOM mount (keeps element in DOM during exit animation)
	 * - panelVisible: drives the CSS transition (off → on = slide out, on → off = slide back)
	 */
	const [showPanel, setShowPanel] = useState(false);
	const [panelVisible, setPanelVisible] = useState(false);
	const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

	// Gate: hide completely for non-test users
	const isTestUser = isNotificationTestUser(email);

	// Hooks — only poll when user qualifies
	const { data: counts } = useNotificationCounts(isTestUser);
	const { data: notifData, isLoading } = useNotifications(showPanel && isTestUser);
	const markAsRead = useMarkAsRead();
	const markAllAsRead = useMarkAllAsRead();

	const totalUnread = counts?.total ?? 0;
	const notifications = notifData?.rows ?? [];

	/**
	 * Resolve the target URL for a notification based on entity_type + entity_id.
	 */
	const getNotificationHref = (n: { entity_type?: string; entity_id?: string; category?: string }): string | null => {
		const { entity_type, entity_id } = n;
		if (!entity_type || !entity_id) return null;

		switch (entity_type) {
			case 'order':
				return `/${domain}/orders/${entity_id}`;
			case 'user':
				// Users can be vendors or customers — use category to distinguish
				if (n.category === 'users') return `/${domain}/vendors/${entity_id}`;
				return `/${domain}/vendors/${entity_id}`;
			case 'product':
				return `/${domain}/products`;
			case 'payout':
				return `/${domain}/payouts`;
			default:
				return null;
		}
	};

	// Set portal target on mount (client-side only)
	useEffect(() => {
		setPortalTarget(document.body);
	}, []);

	/** Open: mount panel → next frame trigger CSS transition */
	const openPanel = () => {
		setShowPanel(true);
		requestAnimationFrame(() => {
			requestAnimationFrame(() => setPanelVisible(true));
		});
	};

	/** Close: start CSS transition back → unmount after transition ends */
	const closePanel = () => {
		setPanelVisible(false);
		setTimeout(() => setShowPanel(false), 300);
	};

	const togglePanel = () => {
		if (showPanel) closePanel();
		else openPanel();
	};

	// Close on Escape key
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') closePanel();
		};
		if (showPanel) document.addEventListener('keydown', handler);
		return () => document.removeEventListener('keydown', handler);
	}, [showPanel]);

	// Close when clicking outside the panel (on the main content area)
	useEffect(() => {
		if (!showPanel) return;
		const handler = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			// If click is outside any notification-panel element, close
			if (!target.closest('[data-notification-panel]') && !target.closest('[data-notification-bell]')) {
				closePanel();
			}
		};
		document.addEventListener('mousedown', handler);
		return () => document.removeEventListener('mousedown', handler);
	}, [showPanel]);

	if (!isTestUser) return null;

	return (
		<>
			{/* Bell Icon Button — rendered inline next to the logo */}
			<button
				onClick={togglePanel}
				className="relative p-1.5 rounded-md text-primary-foreground hover:bg-white/10 transition-colors"
				title="Notifications"
				data-notification-bell
			>
				<Bell className="h-5 w-5" />
				{totalUnread > 0 && (
					<span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
						{totalUnread > 99 ? '99+' : totalUnread}
					</span>
				)}
			</button>

			{/*
			  Portal: renders the panel at document.body level,
			  OUTSIDE the sidebar's stacking context (relative z-50).
			  Panel uses z-40 which is below the sidebar's z-50,
			  so it visually slides out from underneath.
			*/}
			{showPanel && portalTarget && createPortal(
				<div
					data-notification-panel
					className="fixed top-0 h-full flex flex-col bg-background border-r border-border shadow-2xl overflow-hidden"
					style={{
						left: panelVisible ? '16rem' : '0rem',
						width: panelVisible ? '380px' : '16rem',
						transition: 'left 300ms cubic-bezier(0.4, 0, 0.2, 1), width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
						zIndex: 40,
					}}
				>
					{/* Panel Header */}
					<div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
						<div className="flex items-center gap-2">
							<Bell className="h-5 w-5 text-foreground" />
							<h2 className="text-base font-semibold text-foreground">Notifications</h2>
							{totalUnread > 0 && (
								<span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-500">
									{totalUnread}
								</span>
							)}
						</div>
						<div className="flex items-center gap-2">
							{totalUnread > 0 && (
								<button
									onClick={() => markAllAsRead.mutate(undefined)}
									className="text-xs text-muted-foreground hover:text-foreground transition-colors"
									disabled={markAllAsRead.isPending}
								>
									Mark all read
								</button>
							)}
							<button
								onClick={closePanel}
								className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
								title="Close"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
					</div>

					{/* Notification List */}
					<div className="flex-1 overflow-y-auto">
						{isLoading ? (
							<div className="flex items-center justify-center py-16">
								<div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
							</div>
						) : notifications.length === 0 ? (
							<div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
								<Bell className="h-10 w-10 mb-3 opacity-30" />
								<p className="text-sm font-medium">No notifications yet</p>
								<p className="text-xs mt-1 opacity-70">You&apos;re all caught up!</p>
							</div>
						) : (
							notifications.map((n) => (
								<button
									key={n.id}
									onClick={() => {
										if (!n.is_read) markAsRead.mutate([n.id]);
										const href = getNotificationHref(n);
										if (href) {
											closePanel();
											router.push(href);
										}
									}}
									className={cn(
										'w-full text-left px-5 py-4 border-b border-border/50 hover:bg-accent/50 transition-colors',
										!n.is_read && 'bg-accent/20'
									)}
								>
									<div className="flex items-start gap-3">
										{/* Unread dot */}
										<div className="mt-1.5 shrink-0">
											{!n.is_read ? (
												<div className="h-2 w-2 rounded-full bg-blue-500" />
											) : (
												<div className="h-2 w-2" />
											)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium uppercase', CATEGORY_COLORS[n.category] || CATEGORY_COLORS.system)}>
													{n.category}
												</span>
												<span className="text-[11px] text-muted-foreground ml-auto shrink-0">
													{timeAgo(n.created_at)}
												</span>
											</div>
											<p className="text-sm font-medium text-foreground">{n.title}</p>
											<p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
										</div>
									</div>
								</button>
							))
						)}
					</div>
				</div>,
				portalTarget
			)}
		</>
	);
}
