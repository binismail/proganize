"use client";

import { createContext, useContext, useEffect, useState } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type SupabaseContext = {
  supabase: SupabaseClient
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({ 
  children,
}: { 
  children: React.ReactNode 
}) {
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    console.log("Setting up auth state change listener in provider");
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed in provider:", event);
      if (event === 'SIGNED_OUT') {
        console.log("User signed out, clearing state");
        // Clear stored app state
        localStorage.removeItem('appState')
        // Redirect to login page
        window.location.href = '/login'
      }
    })

    return () => {
      console.log("Cleaning up auth listener in provider");
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
}
