import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { AuthPage } from './AuthPage';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { state } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Check URL for auth mode query parameter
  useEffect(() => {
    const updateAuthMode = () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      setAuthMode(mode === 'signup' ? 'signup' : 'login');
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

  // Show auth page if not authenticated
  if (!state.isAuthenticated) {
    return fallback || <AuthPage initialMode={authMode} />;
  }

  // Show protected content if authenticated
  return <>{children}</>;
}