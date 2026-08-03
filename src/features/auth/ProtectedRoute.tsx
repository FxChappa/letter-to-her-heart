import { LoadingScreen } from '../../components/LoadingScreen';
import { ConfigError } from '../../components/ConfigError';
import { Navigate, useLocation } from '../../app/router';
import { useAuth } from './AuthProvider';

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.loading) return <LoadingScreen message="Checking the private door..." />;

  if (auth.mode === 'unconfigured' && auth.configurationError) {
    return <ConfigError message={auth.configurationError} />;
  }

  if (!auth.profile) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
