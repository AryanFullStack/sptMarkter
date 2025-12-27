"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/context/notification-context";
import NotificationDropdown from "./notification-dropdown";

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const { unreadCount, isLoading } = useNotifications();

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="relative"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
                {!isLoading && unreadCount > 0 && (
                    <Badge
                        className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center p-0 bg-red-600 text-white text-xs"
                        variant="destructive"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                )}
            </Button>

            {isOpen && (
                <NotificationDropdown onClose={() => setIsOpen(false)} />
            )}
        </div>
    );
}
