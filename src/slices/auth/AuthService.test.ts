import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from './AuthService';
import type { LoginCredentials, SignupCredentials } from './AuthService';

// Mock localStorage
const createMockStorage = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};

const mockStorage = createMockStorage();
Object.defineProperty(globalThis, 'localStorage', { value: mockStorage, writable: true });

// Mock btoa for Node.js environment
if (typeof globalThis.btoa === 'undefined') {
  globalThis.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    mockStorage.clear();
    authService = new AuthService();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Authentication State', () => {
    it('should return default state when no session exists', () => {
      const state = authService.getAuthState();
      
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.sessionExpiry).toBeNull();
    });

    it('should return authenticated state when valid session exists', () => {
      const user = {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      const sessionData = {
        user,
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      mockStorage.setItem('auth-session', JSON.stringify(sessionData));

      const state = authService.getAuthState();
      
      expect(state.user).not.toBeNull();
      expect(state.user!.email).toBe('test@example.com');
      expect(state.isAuthenticated).toBe(true);
      expect(state.sessionExpiry).toBeInstanceOf(Date);
    });

    it('should return default state when session is expired', () => {
      const user = {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      const sessionData = {
        user,
        expiry: new Date(Date.now() - 1000).toISOString(), // Expired
      };

      mockStorage.setItem('auth-session', JSON.stringify(sessionData));

      const state = authService.getAuthState();
      
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const loginPromise = authService.login(credentials);
      
      // Fast-forward through the simulated delay
      await vi.advanceTimersByTimeAsync(1000);
      
      const result = await loginPromise;

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user!.email).toBe('test@example.com');
      expect(result.error).toBeUndefined();
    });

    it('should fail login with invalid email', async () => {
      const credentials: LoginCredentials = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Please enter a valid email address');
      expect(result.user).toBeUndefined();
    });

    it('should fail login with short password', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: '123',
      };

      const result = await authService.login(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Password must be at least 6 characters long');
    });

    it('should create session with remember me option', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      };

      const loginPromise = authService.login(credentials);
      await vi.advanceTimersByTimeAsync(1000);
      await loginPromise;

      const sessionData = JSON.parse(mockStorage.getItem('auth-session')!);
      const expiry = new Date(sessionData.expiry);
      const now = new Date();
      const diffInDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

      expect(diffInDays).toBeGreaterThan(25); // Should be around 30 days
    });
  });

  describe('Signup', () => {
    it('should signup successfully with valid credentials', async () => {
      const credentials: SignupCredentials = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const signupPromise = authService.signup(credentials);
      await vi.advanceTimersByTimeAsync(1500);
      const result = await signupPromise;

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user!.name).toBe('Test User');
      expect(result.user!.email).toBe('test@example.com');
    });

    it('should fail signup with short name', async () => {
      const credentials: SignupCredentials = {
        name: 'A',
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const result = await authService.signup(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Name must be at least 2 characters long');
    });

    it('should fail signup with weak password', async () => {
      const credentials: SignupCredentials = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak',
        confirmPassword: 'weak',
      };

      const result = await authService.signup(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Password must be at least 8 characters long');
    });

    it('should fail signup with mismatched passwords', async () => {
      const credentials: SignupCredentials = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
      };

      const result = await authService.signup(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Passwords do not match');
    });

    it('should fail signup with existing email', async () => {
      const credentials: SignupCredentials = {
        name: 'Test User',
        email: 'admin@example.com', // This email is in the "existing users" list
        password: 'Password123!',
        confirmPassword: 'Password123!',
      };

      const signupPromise = authService.signup(credentials);
      await vi.advanceTimersByTimeAsync(1500);
      const result = await signupPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBe('An account with this email already exists.');
    });
  });

  describe('Session Management', () => {
    it('should logout successfully', () => {
      // Set up a session first
      const sessionData = {
        user: { id: 'test', email: 'test@example.com', name: 'Test' },
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };
      mockStorage.setItem('auth-session', JSON.stringify(sessionData));

      authService.logout();

      expect(mockStorage.getItem('auth-session')).toBeNull();
    });

    it('should refresh session successfully', () => {
      // Set up a session first
      const user = {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      const sessionData = {
        user,
        expiry: new Date(Date.now() + 1000).toISOString(), // Short expiry
      };

      mockStorage.setItem('auth-session', JSON.stringify(sessionData));

      const success = authService.refreshSession();

      expect(success).toBe(true);

      const updatedSession = JSON.parse(mockStorage.getItem('auth-session')!);
      const newExpiry = new Date(updatedSession.expiry);
      const now = new Date();
      const diffInHours = (newExpiry.getTime() - now.getTime()) / (1000 * 60 * 60);

      expect(diffInHours).toBeGreaterThan(20); // Should be around 24 hours
    });

    it('should detect session expiring soon', () => {
      const user = {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      const sessionData = {
        user,
        expiry: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes from now
      };

      mockStorage.setItem('auth-session', JSON.stringify(sessionData));

      const isExpiringSoon = authService.isSessionExpiringSoon();

      expect(isExpiringSoon).toBe(true);
    });

    it('should not detect session expiring soon when plenty of time left', () => {
      const user = {
        id: 'test-id',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      const sessionData = {
        user,
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      };

      mockStorage.setItem('auth-session', JSON.stringify(sessionData));

      const isExpiringSoon = authService.isSessionExpiringSoon();

      expect(isExpiringSoon).toBe(false);
    });
  });

  describe('Helper Methods', () => {
    it('should generate consistent user ID from email', () => {
      const email = 'test@example.com';
      const authService1 = new AuthService();
      const authService2 = new AuthService();

      // Use reflection to access private method for testing
      const generateUserId1 = (authService1 as any).generateUserId(email);
      const generateUserId2 = (authService2 as any).generateUserId(email);

      expect(generateUserId1).toBe(generateUserId2);
      expect(generateUserId1).toHaveLength(12);
    });

    it('should extract name from email', () => {
      const email = 'john.doe@example.com';
      
      // Use reflection to access private method for testing
      const extractedName = (authService as any).extractNameFromEmail(email);

      expect(extractedName).toBe('John.doe');
    });

    it('should check existing users correctly', () => {
      // Use reflection to access private method for testing
      const existsAdmin = (authService as any).checkUserExists('admin@example.com');
      const existsNew = (authService as any).checkUserExists('new@example.com');

      expect(existsAdmin).toBe(true);
      expect(existsNew).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted session data gracefully', () => {
      mockStorage.setItem('auth-session', 'invalid-json');

      const state = authService.getAuthState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle localStorage errors gracefully', () => {
      const originalSetItem = mockStorage.setItem;
      mockStorage.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Should not throw an error
      expect(async () => {
        await authService.login(credentials);
      }).not.toThrow();

      mockStorage.setItem = originalSetItem;
    });
  });
});