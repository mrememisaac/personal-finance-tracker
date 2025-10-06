# Auth Slice

## Overview

The Auth (Authentication) slice manages user authentication, session management, and access control for the Personal Finance Tracker application. It provides login, signup, logout functionality, session persistence, and route protection to ensure secure access to user financial data.

## Architecture

This slice follows the Vertical Slice Architecture (VSA) pattern:

```
auth/
├── AuthService.ts             # Service layer for authentication
├── AuthContext.tsx           # Authentication context provider
├── AuthPage.tsx              # Main authentication page
├── LoginForm.tsx             # Login form component
├── SignupForm.tsx            # Registration form component
├── UserMenu.tsx              # User menu/profile dropdown
├── ProtectedRoute.tsx        # Route protection component
├── AuthService.test.ts       # Service tests
└── index.ts                  # Public API exports
```

## Components

### AuthService

Service class managing authentication operations and session handling.

**Core Methods:**

#### Authentication
- `login(credentials)`: Authenticates user
  - Validates email and password
  - Creates session
  - Stores session in localStorage
  - Returns `User` object
  
- `signup(credentials)`: Registers new user
  - Validates user data
  - Checks password strength
  - Confirms password match
  - Creates new user account
  - Auto-login after signup
  
- `logout()`: Ends user session
  - Clears session storage
  - Clears user state
  - Redirects to login page

#### Session Management
- `getAuthState()`: Gets current authentication state
  - Reads from localStorage
  - Checks session expiry
  - Returns `AuthState`
  
- `checkSession()`: Validates active session
  - Verifies session hasn't expired
  - Returns boolean
  
- `extendSession()`: Extends session duration
  - Updates expiry time
  - Called on user activity
  
- `refreshSession()`: Refreshes authentication token
  - For token-based auth (future)

#### User Management
- `getCurrentUser()`: Gets logged-in user
  - Returns `User` object or null
  
- `updateProfile(updates)`: Updates user profile
  - Name, email, preferences
  - Validates changes
  
- `changePassword(oldPassword, newPassword)`: Password change
  - Validates old password
  - Checks new password strength
  - Updates password

#### Validation
- `validateEmail(email)`: Email format validation
- `validatePassword(password)`: Password strength validation
  - Minimum 8 characters
  - Must include uppercase, lowercase, number
  - Returns `ValidationResult`

### Data Structures

#### User
```typescript
interface User {
  id: string;           // Unique user ID
  email: string;        // User email
  name: string;         // User display name
  createdAt: Date;      // Account creation date
  lastLogin: Date;      // Last login timestamp
}
```

#### AuthState
```typescript
interface AuthState {
  user: User | null;        // Current user or null
  isAuthenticated: boolean; // Authentication status
  isLoading: boolean;       // Loading state
  sessionExpiry: Date | null; // Session expiration
}
```

#### LoginCredentials
```typescript
interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;  // Extended session
}
```

#### SignupCredentials
```typescript
interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}
```

## UI Components

### AuthPage
Main authentication page with tab switching between login and signup.

**Features:**
- Tab navigation (Login/Signup)
- Responsive layout
- Branding/logo display
- Welcome message
- Error message display
- Loading states

**Props:**
- `initialTab?`: Initial tab ('login' | 'signup')

### LoginForm
Form component for user login.

**Features:**
- Email input with validation
- Password input (masked)
- "Remember me" checkbox
- Submit button with loading state
- Forgot password link (future)
- Form validation
- Error messaging
- Accessibility support

**Props:**
- `onLogin`: Callback with login credentials
- `error?`: Error message to display
- `loading?`: Loading state indicator

### SignupForm
Form component for new user registration.

**Features:**
- Name input
- Email input with validation
- Password input with strength indicator
- Confirm password input
- Terms acceptance checkbox
- Submit button with loading state
- Form validation
- Password strength meter
- Error messaging

**Props:**
- `onSignup`: Callback with signup credentials
- `error?`: Error message to display
- `loading?`: Loading state indicator

### UserMenu
Dropdown menu displaying user information and options.

**Features:**
- User name/email display
- Profile link
- Settings link
- Logout button
- Avatar/initials display
- Dropdown positioning
- Click-outside close
- Keyboard navigation

**Props:**
- `user`: Current user object
- `onLogout`: Logout callback
- `onProfile?`: Profile navigation callback
- `onSettings?`: Settings navigation callback

### ProtectedRoute
Higher-order component protecting routes from unauthorized access.

**Features:**
- Checks authentication status
- Redirects to login if not authenticated
- Preserves intended destination
- Loading state during auth check
- Supports role-based access (future)

**Props:**
- `children`: Protected content
- `redirectTo?`: Redirect path (default: '/login')

### AuthContext
React context providing authentication state and methods throughout the app.

**Provided Value:**
```typescript
{
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}
```

## Usage Examples

### Using AuthContext

```tsx
import { useAuth } from './slices/auth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protecting Routes

```tsx
import { ProtectedRoute } from './slices/auth';
import { Dashboard } from './slices/dashboard';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
```

### Login Flow

```tsx
import { LoginForm } from './slices/auth';

function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      setError(null);
      await login(credentials);
      // Navigate to dashboard on success
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginForm 
      onLogin={handleLogin}
      error={error}
      loading={loading}
    />
  );
}
```

### Signup Flow

```tsx
import { SignupForm } from './slices/auth';

function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleSignup = async (credentials: SignupCredentials) => {
    try {
      setLoading(true);
      setError(null);
      await signup(credentials);
      // Auto-login and redirect
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignupForm 
      onSignup={handleSignup}
      error={error}
      loading={loading}
    />
  );
}
```

### Using AuthService Directly

```typescript
import { AuthService } from './slices/auth';

const authService = new AuthService();

// Login
try {
  const user = await authService.login({
    email: 'user@example.com',
    password: 'SecurePass123',
    rememberMe: true
  });
  console.log('Logged in:', user);
} catch (error) {
  console.error('Login failed:', error);
}

// Check session
const isValid = authService.checkSession();
if (!isValid) {
  authService.logout();
}

// Get current user
const user = authService.getCurrentUser();
if (user) {
  console.log('Current user:', user.name);
}
```

## Authentication Flow

### Login Flow
```
User enters credentials → Validate email format
→ Validate password → Check credentials (mock)
→ Create session → Store in localStorage
→ Update AuthContext → Redirect to dashboard
```

### Signup Flow
```
User enters details → Validate all fields
→ Check password strength → Verify password match
→ Check email uniqueness → Create user account
→ Auto-login → Create session → Redirect to dashboard
```

### Logout Flow
```
User clicks logout → Clear session storage
→ Clear AuthContext → Redirect to login page
```

### Protected Route Access
```
User navigates to route → Check authentication
→ If authenticated: Render route
→ If not authenticated: Redirect to login
→ Store intended destination → Redirect after login
```

## Session Management

### Session Duration
- **Default**: 24 hours
- **Remember Me**: 30 days
- **Inactive Timeout**: 2 hours (future)

### Session Storage
Sessions are stored in localStorage:
```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-15T10:30:00.000Z"
  },
  "expiry": "2024-01-16T10:30:00.000Z"
}
```

### Session Validation
```typescript
// On app load
const authState = authService.getAuthState();
if (authState.isAuthenticated) {
  // User has valid session
  renderApp(authState.user);
} else {
  // Session expired or doesn't exist
  redirectToLogin();
}
```

## Security Considerations

### Current Implementation (Mock Auth)
⚠️ **Note**: Current implementation uses mock authentication for development/demo purposes.

**Security Limitations:**
- Passwords stored in localStorage (not secure)
- No server-side validation
- No encryption
- No rate limiting
- No password hashing

### Production Requirements

For production deployment, implement:

1. **Server-Side Authentication**
   - Backend API for auth operations
   - Secure password hashing (bcrypt)
   - Token-based auth (JWT)
   - HTTPS only

2. **Security Measures**
   - CSRF protection
   - XSS prevention
   - Rate limiting
   - Account lockout after failed attempts
   - Two-factor authentication (2FA)
   - Password reset via email

3. **Session Security**
   - Secure HTTP-only cookies
   - Token refresh mechanism
   - Session invalidation
   - Device tracking

4. **Data Protection**
   - Encrypted data storage
   - Secure API communication
   - Input sanitization
   - SQL injection prevention

## Validation Rules

### Email Validation
- Required field
- Valid email format (regex)
- Case-insensitive
- Unique (for signup)

### Password Validation
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Special characters recommended
- Not same as email

### Name Validation
- Required field
- Minimum 2 characters
- Maximum 50 characters
- Letters, spaces, hyphens only

## Error Handling

Common error scenarios:

### Login Errors
- **Invalid Credentials**: Email or password incorrect
- **Account Not Found**: Email not registered
- **Account Locked**: Too many failed attempts (future)
- **Session Expired**: Previous session expired

### Signup Errors
- **Email Already Exists**: Duplicate email
- **Weak Password**: Password doesn't meet requirements
- **Password Mismatch**: Passwords don't match
- **Invalid Email**: Email format invalid

### Session Errors
- **Session Expired**: Session timeout
- **Invalid Session**: Corrupted session data
- **Unauthorized Access**: Attempting to access protected resource

## Testing

The slice includes test coverage for:

- **Service Tests** (`AuthService.test.ts`): Authentication logic
- **Component Tests**: Form validation and submission
- **Integration Tests**: Full auth flows
- **Security Tests**: Validation and session handling

### Running Tests

```bash
# Run all tests
npm test

# Run auth-specific tests
npm test -- auth
```

## Accessibility

### Keyboard Navigation
- Tab through form fields
- Enter to submit forms
- Escape to close modals

### Screen Reader Support
- Form labels properly associated
- Error messages announced
- Loading states communicated
- Success messages announced

### ARIA Attributes
- `aria-label` on inputs
- `aria-invalid` on error fields
- `aria-describedby` for error messages
- `role="alert"` for notifications

## Best Practices

1. **Secure Passwords**: Use strong, unique passwords
2. **Logout**: Always logout on shared devices
3. **Session Management**: Don't keep sessions active indefinitely
4. **Email Verification**: Verify email addresses (future)
5. **Profile Updates**: Keep profile information current
6. **Security Awareness**: Be cautious of phishing attempts

## Future Enhancements

- [ ] Backend API integration
- [ ] JWT token-based authentication
- [ ] OAuth integration (Google, GitHub)
- [ ] Two-factor authentication (2FA)
- [ ] Email verification
- [ ] Password reset via email
- [ ] Account recovery options
- [ ] Session management dashboard
- [ ] Login history
- [ ] Device management
- [ ] Role-based access control (RBAC)
- [ ] User permissions system
- [ ] Social login
- [ ] Biometric authentication
- [ ] Security audit logs

## Migration Path (Mock to Real Auth)

When ready to implement real authentication:

1. **Backend Setup**
   - Create auth API endpoints
   - Implement password hashing
   - Set up JWT generation/validation
   - Configure secure sessions

2. **Update AuthService**
   - Replace mock methods with API calls
   - Implement token storage
   - Add token refresh logic
   - Handle network errors

3. **Security Hardening**
   - Remove localStorage passwords
   - Implement HTTPS
   - Add CSRF tokens
   - Set up rate limiting

4. **Testing**
   - Update tests for API integration
   - Add security tests
   - Test failure scenarios
   - Load testing

## Dependencies

- React 18+ for UI components
- React Router for navigation protection
- Lucide React for icons
- Shared utilities (validation)
- LocalStorage for session persistence (temporary)

## Related Documentation

- [Dashboard Slice](../dashboard/README.md) - Protected dashboard
- [Transaction Slice](../transaction/README.md) - User-specific transactions
- [Shared Utilities](../../shared/README.md) - Validation utilities

## API Reference

See inline JSDoc comments in source files for detailed API documentation.
