import { AlertCircle } from 'lucide-react';
import { Link } from '../app/router';
import { productName } from '../config/branding';

export function ConfigError({ message }: { message: string }) {
  return (
    <main className="config-error" aria-labelledby="config-error-title">
      <AlertCircle aria-hidden="true" />
      <h1 id="config-error-title">{productName} needs Supabase details</h1>
      <p>{message}</p>
      <p>Add the two values to <code>.env.local</code>, then restart the Vite server.</p>
      <Link to="/">Revisit the letters</Link>
    </main>
  );
}
