import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

type AuthMode = 'login' | 'signup';

interface AuthPageProps {
  onSuccess?: () => void;
  initialMode?: AuthMode;
}

export function AuthPage({ onSuccess, initialMode = 'login' }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {mode === 'login' ? (
          <LoginForm
            onSwitchToSignup={() => setMode('signup')}
            onSuccess={onSuccess}
          />
        ) : (
          <SignupForm
            onSwitchToLogin={() => setMode('login')}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </div>
  );
}