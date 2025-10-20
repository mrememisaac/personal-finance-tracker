import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { AuthPage } from './AuthPage';
import { lazy, Suspense } from 'react';

const LandingPage = lazy(() => import('../../shared/components/LandingPage'));

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { state } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showLanding, setShowLanding] = useState(true);

  // Check URL for auth mode query parameter
  useEffect(() => {
    const updateAuthMode = () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');

      // If there's a mode parameter, user is trying to auth (not landing page view)
      if (mode === 'signup' || mode === 'login') {
        setShowLanding(false);
        setAuthMode(mode === 'signup' ? 'signup' : 'login');
      } else {
        // No mode parameter = show landing page by default when unauthenticated
        setShowLanding(true);
        setAuthMode('login');
      }
    };

    updateAuthMode();

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', updateAuthMode);
    return () => window.removeEventListener('popstate', updateAuthMode);
  }, []);

  // Show loading state while checking authentication
  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show protected content if authenticated
  if (state.isAuthenticated) {
    return <>{children}</>;
  }

  // Not authenticated - show landing page or auth page based on URL mode
  if (showLanding) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <LandingPage />
      </Suspense>
    );
  }

  // User is trying to auth (mode=signup or mode=login)
  return <AuthPage initialMode={authMode} />;
}