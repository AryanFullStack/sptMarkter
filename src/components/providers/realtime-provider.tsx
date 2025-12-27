"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { RealtimeChannel } from "@supabase/supabase-js"
import { SWRConfig } from "swr"

interface RealtimeProviderProps {
    children: React.ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
    const router = useRouter()
    const supabase = createClient()
    const { toast } = useToast()
    const [channels, setChannels] = useState<RealtimeChannel[]>([])

    useEffect(() => {
        // 1. Auth State Listener
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN") {
                toast({
                    title: "Logged In",
                    description: "Successfully signed in to your account.",
                    variant: "default",
                })

                // Fetch role to redirect correctly
                if (session?.user) {
                    const { data: userRole } = await supabase
                        .from('users')
                        .select('role')
                        .eq('id', session.user.id)
                        .single()

                    if (userRole?.role === 'admin') router.push('/admin')
                    else if (userRole?.role === 'sub_admin') router.push('/sub-admin')
                    else if (userRole?.role === 'salesman') router.push('/salesman')
                    else router.push('/dashboard') // Buyer/Retailer
                }

            } else if (event === "SIGNED_OUT") {
                toast({
                    title: "Logged Out",
                    description: "Successfully logged out. Redirecting...",
                })
                router.push("/")
                router.refresh()
            }
        })

        // 2. Global Event Listener (System Wide)
        // Listens for high-level events that should trigger a toast globally
        /* 
        // DISABLED: Notifications are now handled by NotificationProvider
        const channel = supabase
            .channel("global-events")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "notifications",
                },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        const newRecord = payload.new as any
                        toast({
                            title: newRecord.title || "New Notification",
                            description: newRecord.message || "You have a new update.",
                        })
                    }
                }
            )
            .subscribe()

        setChannels((prev) => [...prev, channel])
        */

        return () => {
            subscription.unsubscribe()
            channels.forEach((c) => supabase.removeChannel(c))
        }
    }, [router, supabase, toast])

    return (
        <SWRConfig
            value={{
                refreshInterval: 0, // We rely on realtime!
                revalidateOnFocus: false,
                fetcher: (resource, init) => fetch(resource, init).then(res => res.json())
            }}
        >
            {children}
        </SWRConfig>
    )
}
