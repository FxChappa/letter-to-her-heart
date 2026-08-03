import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { Navigate, RouterProvider, useLocation } from './app/router';
import { AmbientAudioProvider } from './features/audio/AmbientAudioProvider';
import { AuthProvider } from './features/auth/AuthProvider';
import { LoginPage } from './features/auth/LoginPage';
import { WelcomePage } from './features/auth/WelcomePage';
import { ProtectedRoute } from './features/auth/ProtectedRoute';
import { LetterExperience } from './features/letters/LetterExperience';
import { NewChapterPage } from './features/letters/NewChapterPage';
import { OurSpacePage } from './features/world/OurSpacePage';
import { registerServiceWorker } from './lib/pwa/registerServiceWorker';

function AppRoutes() {
  const location = useLocation();
  if (location.pathname === '/') return <WelcomePage />;
  if (location.pathname === '/letters') return <LetterExperience />;
  if (location.pathname === '/letters/new-chapter') return <NewChapterPage />;
  if (location.pathname === '/login') return <LoginPage />;
  if (location.pathname === '/our-space') {
    return (
      <ProtectedRoute>
        <OurSpacePage />
      </ProtectedRoute>
    );
  }
  return <Navigate to="/" replace />;
}

function App() {
  return (
    <React.StrictMode>
      <RouterProvider>
        <AmbientAudioProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </AmbientAudioProvider>
      </RouterProvider>
    </React.StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
registerServiceWorker();
