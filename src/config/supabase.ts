import { createClient } from "@supabase/supabase-js"

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_KEY

if (!url || !key) {
  throw new Error("SUPABASE_URL and SUPABASE_KEY are missing in the .env file")
}

export const BUCKET = process.env.SUPABASE_BUCKET || "listings"

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
})
