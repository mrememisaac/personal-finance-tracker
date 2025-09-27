import { validateEmail, validatePassword } from '../../shared/utils';
import type { ValidationResult } from '../../shared/types';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  lastLogin: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpiry: Date | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export class AuthService {
  private readonly STORAGE_KEY = 'auth-session';
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

  // Get current authentication state
  getAuthState(): AuthState {
    try {
      const sessionData = localStorage.getItem(this.STORAGE_KEY);
      if (!sessionData) {
        return this.getDefaultState();
      }

      const session = JSON.parse(sessionData);
      const now = new Date();
      const expiry = new Date(session.expiry);

      // Check if session is expired
      if (now > expiry) {
        this.logout();
        return this.getDefaultState();
      }

      return {
        user: {
          ...session.user,
          createdAt: new Date(session.user.createdAt),
          lastLogin: new Date(session.user.lastLogin),
        },
        isAuthenticated: true,
        isLoading: false,
        sessionExpiry: expiry,
      };
    } catch (error) {
      console.error('Failed to get auth state:', error);
      return this.getDefaultState();
    }
  }

  // Login with email and password
  async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      // Validate credentials
      const validation = this.validateLoginCredentials(credentials);
      if (!validation.isValid) {
        return { success: false, error: validation.errors[0] };
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo purposes, accept any valid email/password combination
      // In a real app, this would make an API call to authenticate
      const user: User = {
        id: this.generateUserId(credentials.email),
        email: credentials.email,
        name: this.extractNameFromEmail(credentials.email),
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      // Create session
      const sessionDuration = credentials.rememberMe ? this.REMEMBER_ME_DURATION : this.SESSION_DURATION;
      const expiry = new Date(Date.now() + sessionDuration);

      const sessionData = {
        user,
        expiry: expiry.toISOString(),
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));

      return { success: true, user };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  // Sign up new user
  async signup(credentials: SignupCredentials): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      // Validate credentials
      const validation = this.validateSignupCredentials(credentials);
      if (!validation.isValid) {
        return { success: false, error: validation.errors[0] };
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Check if user already exists (simulate)
      const existingUser = this.checkUserExists(credentials.email);
      if (existingUser) {
        return { success: false, error: 'An account with this email already exists.' };
      }

      // Create new user
      const user: User = {
        id: this.generateUserId(credentials.email),
        email: credentials.email,
        name: credentials.name,
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      // Create session
      const expiry = new Date(Date.now() + this.SESSION_DURATION);
      const sessionData = {
        user,
        expiry: expiry.toISOString(),
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));

      return { success: true, user };
    } catch (error) {
      console.error('Signup failed:', error);
      return { success: false, error: 'Signup failed. Please try again.' };
    }
  }

  // Logout user
  logout(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  // Refresh session
  refreshSession(): boolean {
    try {
      const authState = this.getAuthState();
      if (!authState.isAuthenticated || !authState.user) {
        return false;
      }

      // Extend session
      const expiry = new Date(Date.now() + this.SESSION_DURATION);
      const sessionData = {
        user: authState.user,
        expiry: expiry.toISOString(),
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessionData));
      return true;
    } catch (error) {
      console.error('Session refresh failed:', error);
      return false;
    }
  }

  // Check if session is about to expire (within 5 minutes)
  isSessionExpiringSoon(): boolean {
    const authState = this.getAuthState();
    if (!authState.sessionExpiry) return false;

    const now = new Date();
    const fiveMinutes = 5 * 60 * 1000;
    return (authState.sessionExpiry.getTime() - now.getTime()) < fiveMinutes;
  }

  // Private helper methods
  private getDefaultState(): AuthState {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionExpiry: null,
    };
  }

  private validateLoginCredentials(credentials: LoginCredentials): ValidationResult {
    const errors: string[] = [];

    if (!validateEmail(credentials.email)) {
      errors.push('Please enter a valid email address');
    }

    if (!credentials.password || credentials.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private validateSignupCredentials(credentials: SignupCredentials): ValidationResult {
    const errors: string[] = [];

    if (!credentials.name || credentials.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }

    if (!validateEmail(credentials.email)) {
      errors.push('Please enter a valid email address');
    }

    const passwordValidation = validatePassword(credentials.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    if (credentials.password !== credentials.confirmPassword) {
      errors.push('Passwords do not match');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private generateUserId(email: string): string {
    // Simple user ID generation based on email
    return btoa(email).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
  }

  private extractNameFromEmail(email: string): string {
    const username = email.split('@')[0];
    return username.charAt(0).toUpperCase() + username.slice(1);
  }

  private checkUserExists(email: string): boolean {
    // In a real app, this would check against a database
    // For demo, we'll simulate some existing users
    const existingUsers = ['admin@example.com', 'test@test.com'];
    return existingUsers.includes(email.toLowerCase());
  }
}

// Export singleton instance
export const authService = new AuthService();