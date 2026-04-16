import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env'
  )
}

type SupabaseClientSingleton = ReturnType<typeof createClient>

declare global {
  // Prevent duplicate auth clients during Next.js HMR in dev.
  var __supabaseClient: SupabaseClientSingleton | undefined
}

export const supabase =
  globalThis.__supabaseClient ??
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

if (!globalThis.__supabaseClient) {
  globalThis.__supabaseClient = supabase
}

export const signUpWithEmail = async (
  email: string,
  password: string,
  username: string,
  emailRedirectTo?: string
) => {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
      emailRedirectTo,
    },
  })
}

export const signInWithEmail = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({
    email,
    password,
  })
}

export const signOutUser = async () => {
  return supabase.auth.signOut()
}

export const resendSignupEmail = async (email: string, emailRedirectTo?: string) => {
  return supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo,
    },
  })
}
