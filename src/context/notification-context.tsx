"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { createClient } from "@/supabase/client";
import { useAuth } from "@/context/auth-context";
import { Notification } from "@/types/notifications";
import { getNotifications, getUnreadNotificationCount, markNotificationAsRead } from "@/lib/notification-service";
import { playNotificationSound } from "@/utils/notification-helpers";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    refreshNotifications: () => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const { user, userRole, loading: authLoading } = useAuth(); // Use centralized auth
    const { toast } = useToast();
    const router = useRouter();
    const supabase = createClient();

    // Fetch notifications
    const refreshNotifications = useCallback(async () => {
        if (!user) {
            console.log("refreshNotifications: No user, skipping");
            return;
        }

        console.log("refreshNotifications: Fetching for user", user.id);
        setIsLoading(true);
        try {
            const [notificationsResult, countResult] = await Promise.all([
                getNotifications({ limit: 10 }),
                getUnreadNotificationCount(),
            ]);

            console.log("refreshNotifications result:", notificationsResult);

            if (notificationsResult.success) {
                console.log(`Setting ${notificationsResult.notifications.length} notifications`);
                setNotifications(notificationsResult.notifications);
            } else {
                console.error("Failed to fetch notifications:", notificationsResult.error);
            }

            if (countResult.success) {
                console.log(`Setting unread count: ${countResult.count}`);
                setUnreadCount(countResult.count);
            }
        } catch (error) {
            console.error("Error refreshing notifications:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Mark notification as read
    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            await markNotificationAsRead(notificationId);

            // Update local state
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read_status: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    }, []);

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        try {
            const { markAllNotificationsAsRead } = await import("@/lib/notification-service");
            await markAllNotificationsAsRead();

            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, read_status: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    }, []);

    // Initial fetch when user is available
    useEffect(() => {
        if (user && !authLoading) {
            refreshNotifications();
        } else if (!user && !authLoading) {
            setNotifications([]);
            setUnreadCount(0);
            setIsLoading(false);
        }
    }, [user, authLoading, refreshNotifications]);

    // Subscribe to realtime notifications
    useEffect(() => {
        if (!user) return;

        console.log("Setting up realtime subscription for user:", user.id);

        // We need 2 channels: one for user-specific, one for role-based (if applicable)
        // Or one channel with a broader filter? Supabase Realtime filters are limited.
        // Best approach: Subscribe to all INSERTs on notifications table, then client-side filter.
        // Why? Because 'OR' logic in realtime filters is tricky or not supported directly in one string.

        // Actually, we can just subscribe to the table and filter in the callback!
        // This is efficient enough for this scale.

        const channel = supabase
            .channel('notifications-global')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    const newNotification = payload.new as Notification;

                    // Check if this notification is relevant to us
                    const isForMe = newNotification.user_id === user.id;
                    const isForMyRole = userRole && newNotification.role === userRole;

                    if (isForMe || isForMyRole) {
                        console.log("Realtime INSERT received (relevant):", payload);

                        setNotifications(prev => [newNotification, ...prev].slice(0, 10));
                        setUnreadCount(prev => prev + 1);

                        toast({
                            title: newNotification.title,
                            description: newNotification.message,
                            variant: "default",
                        });

                        playNotificationSound();
                    } else {
                        // console.log("Ignored unrelated notification:", newNotification);
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    const updatedNotification = payload.new as Notification;

                    const isForMe = updatedNotification.user_id === user.id;
                    const isForMyRole = userRole && updatedNotification.role === userRole;

                    if (isForMe || isForMyRole) {
                        console.log("Realtime UPDATE received (relevant):", payload);

                        setNotifications(prev =>
                            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
                        );

                        if (updatedNotification.read_status) {
                            setUnreadCount(prev => Math.max(0, prev - 1));
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log("Notification subscription status:", status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, userRole, supabase, toast]);

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
