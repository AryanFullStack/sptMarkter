"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Filter, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Notification, NotificationEventType } from "@/types/notifications";
import { getNotifications, markAllNotificationsAsRead } from "@/lib/notification-service";
import NotificationItem from "@/components/notifications/notification-item";
import { CheckCheck } from "lucide-react";

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterReadStatus, setFilterReadStatus] = useState<"all" | "unread" | "read">("all");
    const [filterEventType, setFilterEventType] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const ITEMS_PER_PAGE = 20;

    // Fetch notifications
    useEffect(() => {
        loadNotifications();
    }, [filterReadStatus, filterEventType, page]);

    const loadNotifications = async () => {
        setIsLoading(true);
        try {
            const filters: any = {
                limit: ITEMS_PER_PAGE,
                offset: (page - 1) * ITEMS_PER_PAGE,
            };

            if (filterReadStatus !== "all") {
                filters.read_status = filterReadStatus === "read";
            }

            if (filterEventType !== "all") {
                filters.event_type = filterEventType as NotificationEventType;
            }

            const result = await getNotifications(filters);
            if (result.success) {
                if (page === 1) {
                    setNotifications(result.notifications);
                } else {
                    setNotifications(prev => [...prev, ...result.notifications]);
                }
                setHasMore(result.notifications.length === ITEMS_PER_PAGE);
            }
        } catch (error) {
            console.error("Error loading notifications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        await markAllNotificationsAsRead();
        await loadNotifications();
    };

    const handleResetFilters = () => {
        setFilterReadStatus("all");
        setFilterEventType("all");
        setSearchQuery("");
        setPage(1);
    };

    // Filter notifications by search query
    const filteredNotifications = notifications.filter(notification => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            notification.title.toLowerCase().includes(query) ||
            notification.message.toLowerCase().includes(query)
        );
    });

    const unreadCount = notifications.filter(n => !n.read_status).length;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                            {unreadCount > 0 && (
                                <p className="text-sm text-gray-500 mt-1">
                                    {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                            >
                                <CheckCheck className="h-4 w-4 mr-2" />
                                Mark all read
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search notifications..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Filter by read status */}
                        <Select value={filterReadStatus} onValueChange={(value: any) => setFilterReadStatus(value)}>
                            <SelectTrigger className="w-full md:w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="unread">Unread</SelectItem>
                                <SelectItem value="read">Read</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Filter by event type */}
                        <Select value={filterEventType} onValueChange={setFilterEventType}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Event type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Events</SelectItem>
                                <SelectItem value="order_created">Orders</SelectItem>
                                <SelectItem value="payment_received">Payments</SelectItem>
                                <SelectItem value="user_registered">Users</SelectItem>
                                <SelectItem value="salesman_assigned">Salesman</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Reset filters */}
                        {(filterReadStatus !== "all" || filterEventType !== "all" || searchQuery) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleResetFilters}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Reset
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Notifications List */}
            <div className="container mx-auto px-4 py-6">
                {isLoading && page === 1 ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                        <div className="flex flex-col items-center">
                            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Filter className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications found</h3>
                            <p className="text-gray-500">
                                {searchQuery || filterReadStatus !== "all" || filterEventType !== "all"
                                    ? "Try adjusting your filters or search query"
                                    : "You don't have any notifications yet"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
                        {filteredNotifications.map((notification) => (
                            <NotificationItem key={notification.id} notification={notification} />
                        ))}
                    </div>
                )}

                {/* Load More */}
                {hasMore && filteredNotifications.length > 0 && (
                    <div className="flex justify-center mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setPage(p => p + 1)}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                "Load More"
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
