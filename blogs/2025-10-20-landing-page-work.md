# Shipping a landing page: issue → branch → implementation → PR

**Date:** October 20, 2025  
**Author:** Ima  
**Project:** Personal Finance Tracker

---

This short post documents the steps I took to add a simple, appealing landing page to the Personal Finance Tracker project. The goal: provide a modern hero, short feature highlights, and a clear call-to-action that drives signups.

## TL;DR

- Created GitHub issue #47 to track the task
- Implemented the landing page on branch `feature/landing-page`
- Added `src/shared/components/LandingPage.tsx` and `src/shared/styles/landing.css`
- Committed and pushed changes to origin
- Opened PR #48 to merge the feature into `main`

## Why this landing page?

A focused landing page helps convert casual visitors into signups by communicating the product's primary value quickly and inviting them to take the next step.

## What I created

- `src/shared/components/LandingPage.tsx` — simple, accessible React component with hero, features, and CTA
- `src/shared/styles/landing.css` — lightweight stylesheet for the landing page
- Exported the component from `src/shared/components/index.ts`

## Workflow steps

1. Created a GitHub issue (https://github.com/mrememisaac/personal-finance-tracker/issues/47) describing requirements, assigning to myself, and using labels.
2. Created branch `feature/landing-page` and switched to it.
3. Implemented the component and styles. Fixed a CSS syntax issue and removed a bad import from the component.
4. Committed changes:
   - `c87a3b1` — feat(landing): add LandingPage component and styles
   - `dfba68a` — chore(landing): format and tidy imports
5. Pushed the branch to origin and opened PR #48: https://github.com/mrememisaac/personal-finance-tracker/pull/48
6. Updated the issue with progress and closed it after opening the PR.

## Notes and next steps

- Integration: I didn't modify `App.tsx` routing yet — next step is to integrate the landing page as the default route or add a route to show it.
- Visual polish: Consider adding an illustration (SVG) and small animations to improve conversion.
- Accessibility: The component uses semantic markup; I recommend running axe or an a11y audit in CI.
- Tests: Add a simple rendering test and accessibility check to the CI pipeline before merging.

---

If you want, I can now integrate the `LandingPage` into `App.tsx`, add a unit test, and include a small hero SVG. Which would you like me to do next?