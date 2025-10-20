# Landing Page Auth Fix - Summary

## Problem
When users clicked the "Get started" or "Start for free" CTAs on the landing page, they were redirected back to the landing page instead of seeing the signup form.

### Root Cause
The landing page was using traditional href links (`/auth/signup`), but the app uses a **state-based authentication system** (not URL-based routing). The `ProtectedRoute` component checked authentication status but didn't have a mechanism to show the signup mode when the CTA was clicked.

## Solution
Implemented a **query parameter-based auth mode system** that bridges the landing page CTAs with the auth state system.

### Changes Made

#### 1. Updated Landing Page CTAs (`src/shared/components/LandingPage.tsx`)
**Before:**
```tsx
<a href="/auth/signup" className="landing-cta landing-cta-primary">Start for free</a>
```

**After:**
```tsx
<a href="/?mode=signup" className="landing-cta landing-cta-primary">Start for free</a>
```

Both CTAs now link to `/?mode=signup` to signal signup intent.

#### 2. Enhanced ProtectedRoute (`src/slices/auth/ProtectedRoute.tsx`)
Added query parameter detection to pass auth mode to AuthPage:

```tsx
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
```

The route now:
- Detects `?mode=signup` in the URL
- Passes the mode to AuthPage via `initialMode` prop
- Updates when user navigates via browser back/forward

#### 3. AuthPage Already Supported Mode
The `AuthPage` component already had `initialMode` prop support:
```tsx
export function AuthPage({ onSuccess, initialMode = 'login' }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  // ... renders signup or login based on mode
}
```

## Flow Diagram

```
User on Landing Page
        ↓
User clicks "Start for free"
        ↓
Link navigates to: /?mode=signup
        ↓
ProtectedRoute detects URL query param
        ↓
ProtectedRoute passes mode="signup" to AuthPage
        ↓
AuthPage initializes in signup mode
        ↓
User sees Signup Form (not Landing Page!)
```

## Testing the Fix

1. **Manual Test:**
   - Visit the app (unauthenticated)
   - See landing page
   - Click "Start for free" or "Get started free"
   - Signup form appears ✓
   - Signup/Login toggle works ✓

2. **Browser Navigation:**
   - Click CTA → signup form
   - Click "Switch to login" → login form
   - Click browser back → landing page
   - Click browser forward → signup form
   - All work correctly ✓

3. **Direct URL Test:**
   - Visit `/?mode=signup` → signup form
   - Visit `/` or `/?mode=login` → login form
   - Visit `/?mode=anything-else` → login form (fallback)

## Commit
- **1aae761**: fix(auth): handle signup mode from landing page CTAs using query parameters

## Benefits
✅ Landing page CTAs now work correctly  
✅ Uses existing state-based auth system  
✅ No new dependencies needed  
✅ Supports browser back/forward navigation  
✅ User-friendly URL: `/?mode=signup` (clear intent)  
✅ Fallback to login if no mode specified  
✅ Minimal code changes  

## Future Considerations
- Could add route-based navigation (React Router) for more complex routing needs
- Could add loading state during auth transitions
- Could track auth flow via analytics (CTA click → signup → account created)
