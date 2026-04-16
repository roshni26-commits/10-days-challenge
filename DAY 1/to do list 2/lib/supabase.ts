import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const signUpWithEmail = async (email: string, password: string, username: string) => {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
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
