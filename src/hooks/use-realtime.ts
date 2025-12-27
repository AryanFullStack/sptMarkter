"use client"

import useSWR, { useSWRConfig } from "swr"
import { useEffect } from "react"
import { createClient } from "@/supabase/client"

// Simple fetcher for SWR
const fetcher = async (key: string) => {
  // We assume the key is a URL or a unique identifier we can parse.
  // For Supabase direct table access, we might need a different approach,
  // but usually we fetch from our own API Routes or Actions.
  // Here we'll assume the key is passed to a specific server action or API.
  // Ideally, SWR is used with API endpoints.
  
  // If key starts with /, fetch it.
  if (key.startsWith('/')) {
    const res = await fetch(key)
    return res.json()
  }
  return null
}

export function useRealtime<T>(
  key: string | null,
  table: string,
  filter?: string // e.g., "id=eq.1"
) {
  const { mutate } = useSWRConfig()
  const supabase = createClient()
  
  const { data, error, isLoading, isValidating } = useSWR<T>(key, fetcher)

  useEffect(() => {
    if (!table) return

    const channel = supabase
      .channel(`swr-${table}-${filter || "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
          filter: filter,
        },
        () => {
          // When a change happens, revalidate the SWR key
          if (key) mutate(key)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, table, filter, key, mutate])

  return { data, error, isLoading, isValidating }
}
