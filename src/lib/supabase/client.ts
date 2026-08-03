import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { getSupabaseEnv } from './env';

let cachedClient: SupabaseClient<Database> | null = null;

export const supabaseEnv = getSupabaseEnv();

export const getSupabaseClient = (): SupabaseClient<Database> | null => {
  if (!supabaseEnv.configured) return null;
  if (!cachedClient) {
    cachedClient = createClient<Database>(supabaseEnv.url, supabaseEnv.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 12,
        },
      },
    });
  }
  return cachedClient;
};

export const authorizeRealtime = async (client: SupabaseClient<Database>): Promise<void> => {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error('The private realtime session is not ready.');
  }
  await client.realtime.setAuth(data.session.access_token);
};
