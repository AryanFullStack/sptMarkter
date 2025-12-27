"use client";

import { useRouter } from "next/navigation";
import { Notification } from "@/types/notifications";
import { useNotifications } from "@/context/notification-context";
import {
    getNotificationIcon,
    getNotificationIconColor,
    getRelativeTime,
    getNotificationLink,
} from "@/utils/notification-helpers";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
    notification: Notification;
    onClose?: () => void;
}

export default function NotificationItem({ notification, onClose }: NotificationItemProps) {
    const router = useRouter();
    const { markAsRead } = useNotifications();
    const Icon = getNotificationIcon(notification.event_type);
    const iconColor = getNotificationIconColor(notification.event_type);
    const link = getNotificationLink(notification);

    const handleClick = async () => {
        // Mark as read
        if (!notification.read_status) {
            await markAsRead(notification.id);
        }

        // Navigate if there's a link
        if (link) {
            router.push(link);
            onClose?.();
        }
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "flex gap-3 p-4 transition-colors cursor-pointer",
                notification.read_status
                    ? "bg-white hover:bg-gray-50"
                    : "bg-blue-50 hover:bg-blue-100",
                link && "cursor-pointer"
            )}
        >
            {/* Icon */}
            <div className={cn("flex-shrink-0 mt-1", iconColor)}>
                <Icon className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p
                    className={cn(
                        "text-sm",
                        notification.read_status ? "font-normal text-gray-900" : "font-semibold text-gray-900"
                    )}
                >
                    {notification.title}
                </p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {notification.message}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                    {getRelativeTime(notification.created_at)}
                </p>
            </div>

            {/* Unread indicator */}
            {!notification.read_status && (
                <div className="flex-shrink-0">
                    <div className="h-2 w-2 bg-blue-600 rounded-full mt-2" />
                </div>
            )}
        </div>
    );
}
