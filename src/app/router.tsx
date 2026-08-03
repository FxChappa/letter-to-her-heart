import React, { AnchorHTMLAttributes, createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type NavigationOptions = {
  replace?: boolean;
  state?: unknown;
};

type LocationState = {
  pathname: string;
  state: unknown;
};

type RouterContextValue = LocationState & {
  navigate: (to: string, options?: NavigationOptions) => void;
};

const RouterContext = createContext<RouterContextValue | null>(null);

const currentLocation = (): LocationState => ({
  pathname: window.location.pathname || '/',
  state: window.history.state ?? null,
});

export function RouterProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<LocationState>(() => currentLocation());

  useEffect(() => {
    const handlePopState = () => setLocation(currentLocation());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string, options: NavigationOptions = {}) => {
    const safePath = to.startsWith('/') && !to.startsWith('//') && !to.includes('\\') ? to : '/';
    if (options.replace) {
      window.history.replaceState(options.state ?? null, '', safePath);
    } else {
      window.history.pushState(options.state ?? null, '', safePath);
    }
    setLocation({ pathname: safePath, state: options.state ?? null });
    window.scrollTo({ top: 0 });
  }, []);

  const value = useMemo<RouterContextValue>(() => ({
    ...location,
    navigate,
  }), [location, navigate]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export const useNavigate = () => {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useNavigate must be used within RouterProvider');
  return context.navigate;
};

export const useLocation = () => {
  const context = useContext(RouterContext);
  if (!context) throw new Error('useLocation must be used within RouterProvider');
  return { pathname: context.pathname, state: context.state };
};

export function Navigate({ to, replace = false, state }: { to: string; replace?: boolean; state?: unknown }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace, state });
  }, [navigate, replace, state, to]);
  return null;
}

export function Link({ to, children, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const navigate = useNavigate();
  return (
    <a
      {...props}
      href={to}
      onClick={event => {
        onClick?.(event);
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}
