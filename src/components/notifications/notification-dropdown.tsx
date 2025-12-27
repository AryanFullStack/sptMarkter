"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/context/notification-context";
import NotificationItem from "./notification-item";

interface NotificationDropdownProps {
    onClose: () => void;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
    const { notifications, unreadCount, isLoading, markAllAsRead } = useNotifications();
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    const handleViewAll = () => {
        router.push("/notifications");
        onClose();
    };

    return (
        <div
            ref={dropdownRef}
            className="absolute right-0 top-12 z-50 w-80 md:w-96 rounded-lg border border-gray-200 bg-white shadow-lg"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="font-semibold text-lg">Notifications</h3>
                {unreadCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        className="text-xs"
                    >
                        <CheckCheck className="h-4 w-4 mr-1" />
                        Mark all read
                    </Button>
                )}
            </div>

            {/* Notifications List */}
            <ScrollArea className="h-[400px]">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <Bell className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No notifications</p>
                        <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onClose={onClose}
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Footer */}
            {notifications.length > 0 && (
                <>
                    <Separator />
                    <div className="p-3">
                        <Button
                            variant="ghost"
                            className="w-full text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={handleViewAll}
                        >
                            View all notifications
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}

function Bell({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
    );
}
