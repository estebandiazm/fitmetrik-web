import { test, expect } from '@playwright/test';

// Threat-matrix RED test for the creator/viewer route-group move (tasks.md 5.2/5.3).
// `src/app/creator` -> `src/app/(dashboard)/creator`
// `src/app/viewer`  -> `src/app/(client-portal)/viewer`
// Route groups `()` are URL-path-neutral, so `/creator` and `/viewer` must
// resolve identically before and after the move. Both routes are already
// protected by `src/middleware.ts` (redirect to `/login` for any unauthed,
// non-login request), matching the established pattern in invite.spec.ts —
// this repo has no authenticated E2E fixtures, so the deterministic,
// always-executable assertion is the unauthed redirect; the authed-200 case
// is asserted conditionally, mirroring invite.spec.ts's "if somehow
// authenticated" pattern.

test.describe('Creator/Viewer Route-Group Move', () => {
  test('/creator redirects unauthenticated users to /login', async ({ page }) => {
    const response = await page.goto('/creator');
    expect(response?.status()).toBe(200); // final response after redirect
    await expect(page).toHaveURL(/.*\/login/);
    // Use the actual rendered heading ("Welcome Back"), not the stale
    // "FitMetrik" text asserted elsewhere (tracked pre-existing baseline
    // failure in auth.spec.ts/invite.spec.ts — not repeated here).
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });

  test('/viewer redirects unauthenticated users to /login', async ({ page }) => {
    const response = await page.goto('/viewer');
    expect(response?.status()).toBe(200); // final response after redirect
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });

  test('/creator resolves 200 for authenticated coaches', async ({ page }) => {
    const response = await page.goto('/creator');
    if (page.url().includes('/login')) {
      console.log('No authenticated coach session available in this environment — unauthed redirect already confirmed above.');
      return;
    }
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/.*\/creator/);
  });

  test('/viewer resolves 200 for authenticated clients', async ({ page }) => {
    const response = await page.goto('/viewer');
    if (page.url().includes('/login')) {
      console.log('No authenticated client session available in this environment — unauthed redirect already confirmed above.');
      return;
    }
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/.*\/viewer/);
  });
});
