# Shipping a landing page: issue → branch → implementation → PR → auth routing

**Date:** October 20, 2025  
**Author:** Ima  
**Project:** Personal Finance Tracker  
**Status:** Complete with all features working

---

This post documents the complete steps I took to add a landing page to the Personal Finance Tracker project, from initial issue through implementation, testing, polish, and finally fixing the authentication routing so signup CTAs work correctly.

## TL;DR

✅ Created GitHub issue #47  
✅ Implemented landing page on `feature/landing-page`  
✅ Added professional SVG icons and improved copy  
✅ Created test suite and CI/CD workflow  
✅ Fixed signup auth routing (took 3 commits to get right!)  
✅ Opened PR #48 with 10 commits  
✅ All features working, ready to merge  

## Why this landing page?

A focused landing page helps convert casual visitors into signups by communicating the product's primary value quickly and inviting them to take the next step. Critical features:
- Clear value proposition
- Trust signals (no ads, offline support, free)
- Professional visual design
- Working signup flow

## What I created

- `src/shared/components/LandingPage.tsx` — React component with hero, 3 features, trust section, CTAs
- `src/shared/styles/landing.css` — responsive, professional styling
- `src/shared/components/__tests__/LandingPage.test.tsx` — render and accessibility tests
- `.github/workflows/ci.yml` — GitHub Actions CI for build/test/a11y audit
- `test/setup.ts` — Vitest polyfills for DOM APIs
- `scripts/a11y-landing.js` — Accessibility audit script using axe-core
- `public/favicon.svg` — Custom favicon with wallet + trending icon

## Workflow & Key Milestones

### Phase 1: Initial Implementation (Commits 1-3)
- Created GitHub issue #47
- Implemented component and styles
- Fixed CSS syntax errors
- Removed bad imports
- Tested locally

### Phase 2: Polish & Testing (Commits 4-6)
- Added SVG illustration to hero
- Created unit test for component
- Created CI workflow (build, test, a11y audit)
- Added Vitest setup with polyfills
- Added accessibility audit automation

### Phase 3: Visual Enhancement (Commits 7-8)
- Improved copy and headlines
- Added trust section with 3 value props
- Upgraded emoji icons to professional Lucide React SVG icons
- Enhanced styling with gradient backgrounds

### Phase 4: Auth Routing Fix (Commits 9-10) ⭐ Most Important
- **Problem**: Clicking signup CTA showed landing page instead of signup form
- **Initial attempt**: Query parameter system (`/?mode=signup`)
- **Second attempt**: ProtectedRoute shows AuthPage when mode present
- **Final solution**: Complete refactor - ProtectedRoute manages all cases (landing, auth, authenticated)
- **Result**: Full signup flow now works

## Technical Details

### Landing Page Component
```tsx
- Hero section with title, subtitle, tagline, CTA
- 3 feature cards with Lucide React icons (TrendingUp, Lock, BarChart3)
- Trust section highlighting: 100% Free, Offline capable, Fast
- Responsive grid layout
- Lazy-loaded for performance
```

### Auth Routing Solution
```
Landing Page (/) 
  ↓
User clicks CTA → /?mode=signup
  ↓
ProtectedRoute detects mode=signup
  ↓
Renders AuthPage (signup mode)
  ↓
User fills form → submit
  ↓
Auth succeeds → state.isAuthenticated = true
  ↓
ProtectedRoute re-renders → shows MainApp
```

### Design & Branding
- Color palette: Teal accent (#0ea5a4), clean grays
- Typography: Inter font family (system default)
- Icons: Lucide React for consistency
- Favicon: Custom wallet + trending chart SVG

## Testing

✅ Component renders correctly  
✅ CTAs work and navigate to signup  
✅ Signup form displays (not landing page)  
✅ Form validation works  
✅ Successful signup shows dashboard  
✅ Browser back/forward navigation works  
✅ Accessibility audit passes (axe-core)  
✅ CI/CD checks pass (build, test, a11y)  

## Commits Summary

| # | Commit | What |
|---|--------|------|
| 1 | c87a3b1 | Initial component & styles |
| 2 | dfba68a | Format & tidy imports |
| 3 | 4937f7c | Integrate into App.tsx |
| 4 | 97e3600 | Add SVG illustration & tests |
| 5 | ed32285 | Add Vitest setup polyfills |
| 6 | f38608f | Add a11y audit & CI |
| 7 | 9d45174 | Improve copy & add trust section |
| 8 | 49e5bce | Upgrade to Lucide React icons |
| 9 | 1aae761 | Initial auth routing fix |
| 10 | f441293 | Complete auth routing refactor |

## Key Learnings

1. **State-based auth + URL CTAs = Query parameters**: Use `?mode=signup` to signal intent to state-based router
2. **Fallback props hide logic**: Directly managing component states is clearer than using fallback patterns
3. **Test infrastructure matters**: Polyfills and setup files catch environment issues early
4. **Icons matter**: Professional SVG icons make a big difference in perceived quality
5. **Iterative debugging**: Sometimes you need to fix a problem 2-3 times to get it right
6. **Browser navigation**: Always handle `popstate` events for back/forward button support
7. **Small focused commits**: 10 specific commits easier to review than one large change

## Deployment Ready

The landing page is complete, tested, and production-ready. Users can now:
- 👀 See professional landing page (instead of auth form)
- 📝 Click signup CTA and see signup form (now working!)
- ✅ Create account and access dashboard
- ⬅️➡️ Navigate with browser buttons without issues
- ♿ Access content with screen readers (WCAG compliant)

## Files Changed

- Added: 7 new files (component, styles, tests, CI, favicon)
- Modified: 3 core files (App.tsx, ProtectedRoute.tsx, index.html)
- Created: 3 blog posts documenting the journey

---

**PR #48** is ready for review and merge!
