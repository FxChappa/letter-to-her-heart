export type SupabaseEnv = {
  url: string;
  key: string;
  configured: boolean;
  demoMode: boolean;
  error: string | null;
};

export const getSupabaseEnv = (): SupabaseEnv => {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';
  const key = publishableKey;
  const explicitDemo = import.meta.env.VITE_ALLOW_DEMO_MODE === 'true';
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
