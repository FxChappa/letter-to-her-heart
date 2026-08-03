export type SupabaseEnv = {
  url: string;
  key: string;
  configured: boolean;
  demoMode: boolean;
  error: string | null;
};

const readEnv = (key: string): string => {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value.trim() : '';
};

export const getSupabaseEnv = (): SupabaseEnv => {
  const url = readEnv('VITE_SUPABASE_URL');
  const publishableKey = readEnv('VITE_SUPABASE_PUBLISHABLE_KEY');
  const key = publishableKey;
  const explicitDemo = readEnv('VITE_ALLOW_DEMO_MODE') === 'true';
  const configured = Boolean(url && key);
  const demoMode = !configured && (import.meta.env.DEV || explicitDemo);

  if (configured) {
    return { url, key, configured, demoMode: false, error: null };
  }

  const error = [
    'Supabase is not configured yet.',
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.',
  ].join(' ');

  return { url, key, configured, demoMode, error };
};
