import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService, type AuthState, type User, type LoginCredentials, type SignupCredentials } from './AuthService';

// Action types
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REFRESH_SESSION' }
  | { type: 'CLEAR_ERROR' };

// Extended auth state with error handling
interface ExtendedAuthState extends AuthState {
  error: string | null;
}

// Auth context type
interface AuthContextType {
  state: ExtendedAuthState;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  signup: (credentials: SignupCredentials) => Promise<boolean>;
  logout: () => void;
  refreshSession: () => void;
  clearError: () => void;
}

// Auth reducer
function authReducer(state: ExtendedAuthState, action: AuthAction): ExtendedAuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: null,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        sessionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        sessionExpiry: null,
      };

    case 'LOGOUT':
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        sessionExpiry: null,
      };

    case 'REFRESH_SESSION':
      const authState = authService.getAuthState();
      return {
        ...state,
        ...authState,
        error: null,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Initialize state from stored session
  const initialState: ExtendedAuthState = {
    ...authService.getAuthState(),
    error: null,
  };

  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check session on mount and set up session monitoring
  useEffect(() => {
    // Refresh session state
    dispatch({ type: 'REFRESH_SESSION' });

    // Set up session expiry monitoring
    const checkSession = () => {
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated && state.isAuthenticated) {
        // Session expired
        dispatch({ type: 'LOGOUT' });
      } else if (authService.isSessionExpiringSoon()) {
        // Auto-refresh session if expiring soon
        if (authService.refreshSession()) {
          dispatch({ type: 'REFRESH_SESSION' });
        }
      }
    };

    // Check session every minute
    const interval = setInterval(checkSession, 60000);

    return () => clearInterval(interval);
  }, [state.isAuthenticated]);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const result = await authService.login(credentials);

      if (result.success && result.user) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: result.user });
        return true;
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: result.error || 'Login failed' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'An unexpected error occurred' });
      return false;
    }
  };

  // Signup function
  const signup = async (credentials: SignupCredentials): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const result = await authService.signup(credentials);

      if (result.success && result.user) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: result.user });
        return true;
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: result.error || 'Signup failed' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'An unexpected error occurred' });
      return false;
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  };

  // Refresh session function
  const refreshSession = () => {
    if (authService.refreshSession()) {
      dispatch({ type: 'REFRESH_SESSION' });
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextType = {
    state,
    login,
    signup,
    logout,
    refreshSession,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}