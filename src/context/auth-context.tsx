"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/supabase/client";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    userRole: string | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
    children,
    initialUser = null,
    initialUserRole = null
}: {
    children: React.ReactNode,
    initialUser?: User | null,
    initialUserRole?: string | null
}) {
    const [user, setUser] = useState<User | null>(initialUser);
    const [userRole, setUserRole] = useState<string | null>(initialUserRole);
    // If we have initial data, we are not loading. If no initial data, we perform client-side check.
    const [loading, setLoading] = useState(!initialUser);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        let mounted = true;

        async function getInitialSession() {
            // If we already have user from server props, we might skip this or just verify?
            // To be safe and keep real-time sync, we still check, but we don't block UI with 'loading'.

            try {
                const {
                    data: { user: authUser },
                } = await supabase.auth.getUser();

                if (mounted) {
                    if (authUser) {
                        setUser(authUser);
                        if (authUser.id !== user?.id) {
                            await fetchUserRole(authUser.id);
                        }
                    } else {
                        // Only clear if we really have no user (and server thought we did? rare)
                        // Or if server said null, we stay null.
                        setUser(null);
                        setUserRole(null);
                    }
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error checking auth:", error);
                if (mounted) setLoading(false);
            }
        }

        getInitialSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth state change:", event);

            if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
                if (session?.user) {
                    setUser(session.user);
                    await fetchUserRole(session.user.id);
                }
            } else if (event === "SIGNED_OUT") {
                setUser(null);
                setUserRole(null);
                router.refresh();
            } else if (event === "USER_UPDATED") {
                if (session?.user) {
                    setUser(session.user);
                }
            }

            setLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [supabase, router]);

    async function fetchUserRole(userId: string) {
        try {
            const { data: userData } = await supabase
                .from("users")
                .select("role")
                .eq("id", userId)
                .single();

            if (userData) {
                setUserRole(userData.role);
            }
        } catch (error) {
            console.error("Error fetching user role:", error);
        }
    }

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
            setUserRole(null);
            router.push("/");
            router.refresh();
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, userRole, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
