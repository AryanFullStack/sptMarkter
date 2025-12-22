import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log("=== Admin Client Creation Debug ===");
  console.log("NEXT_PUBLIC_SUPABASE_URL exists:", !!supabaseUrl);
  console.log("SUPABASE_SERVICE_ROLE_KEY exists:", !!serviceRoleKey);
  
  if (!serviceRoleKey) {
    console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not available in process.env");
    console.error("Available env keys:", Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    return null;
  }
  
  if (!supabaseUrl) {
    console.error("CRITICAL: NEXT_PUBLIC_SUPABASE_URL is not available");
    return null;
  }
  
  console.log(`✓ Creating admin client for ${supabaseUrl.split('//')[1].split('.')[0]}...`);
  
  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        fetch: (url, options) => {
          return fetch(url, {
            ...options,
            // @ts-ignore
            duplex: 'half',
          })
        }
      }
    }
  )
}
