import { FormEvent, useState } from 'react';
import { Heart, LockKeyhole, Mail, Sparkles } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from '../../app/router';
import { productName, productSubtitle } from '../../config/branding';
import type { ProfileRole } from '../../lib/supabase/database.types';
import { useAuth } from './AuthProvider';

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = typeof location.state === 'object' && location.state && 'from' in location.state
    ? String(location.state.from)
    : '/our-space';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (auth.profile) return <Navigate to={from} replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await auth.signIn(email, password);
      navigate(from, { replace: true });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Sign in did not work. Check the email and password.');
    } finally {
      setSubmitting(false);
    }
  };

  const chooseDemo = (role: ProfileRole) => {
    auth.continueDemo(role);
    navigate('/our-space', { replace: true });
  };

  return (
    <main className="login-page" aria-labelledby="login-title">
      <section className="login-card">
        <p className="kicker"><Sparkles size={14} /> {productSubtitle}</p>
        <h1 id="login-title">{productName}</h1>
        <p>Sign in with the private account created for Aldane or Santana.</p>

        {auth.mode === 'supabase' ? (
          <form className="login-form" onSubmit={submit}>
            <label>
              <span>Email</span>
              <input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required />
            </label>
            <label>
              <span>Password</span>
              <input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" disabled={submitting}>
              <LockKeyhole size={17} />
              {submitting ? 'Opening...' : 'Enter our space'}
            </button>
          </form>
        ) : (
          <div className="demo-login" role="status">
            <Mail aria-hidden="true" />
            <p>{auth.configurationError}</p>
            <p className="demo-login__note">Demo mode is for local visual testing only. It is clearly labeled and should stay off in production unless you set <code>VITE_ALLOW_DEMO_MODE=true</code>.</p>
            {auth.mode === 'demo' && (
              <div className="demo-login__actions">
                <button type="button" onClick={() => chooseDemo('santana')}>Continue as Santana (demo)</button>
                <button type="button" onClick={() => chooseDemo('aldane')}>Continue as Aldane (demo)</button>
              </div>
            )}
          </div>
        )}

        <Link className="login-card__link" to="/letters">
          <Heart size={14} fill="currentColor" />
          Revisit the letters
        </Link>
      </section>
    </main>
  );
}
