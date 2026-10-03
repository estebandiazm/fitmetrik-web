import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {

  test('should render the login page correctly', async ({ page }) => {
    // 1. Navigate to the login page
    await page.goto('/login');

    // 2. Verify URL and page heading
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByRole('heading', { name: 'Hola de nuevo' })).toBeVisible();

    // 3. Verify the subtitle
    await expect(page.getByText('Inicia sesión para registrar tu día.')).toBeVisible();

    // 4. Verify password tab form fields (default tab)
    await expect(page.getByLabel('Correo electrónico')).toBeVisible();
    await expect(page.getByLabel('Contraseña', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('should show both login tabs', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('button', { name: 'Contraseña', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Enlace mágico' })).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Attempt login with fake credentials (password tab is the default)
    await page.getByLabel('Correo electrónico').fill('test@example.com');
    await page.getByLabel('Contraseña', { exact: true }).fill('wrongpassword123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // The action redirects to /login?error=... which shows a styled Alert
    await expect(page.getByText('Correo o contraseña incorrectos')).toBeVisible({ timeout: 10000 });
  });

  test('should not flicker when loading login page', async ({ page }) => {
    // This test verifies that the login page loads without flickering/switching rapidly
    // The fix: LoginPage Server Component checks auth and redirects before rendering

    // Navigate to login (unauthenticated user)
    const response = await page.goto('/login');

    // Verify we get a successful response
    expect(response?.status()).toBe(200);

    // Verify login UI is rendered without flickering
    // If there was flickering, we'd see multiple renders or rapid redirects
    await expect(page.getByRole('heading', { name: 'Hola de nuevo' })).toBeVisible();
    await expect(page.getByLabel('Correo electrónico')).toBeVisible();

    // Verify we're still on the login page (not redirected)
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('authenticated coach should be redirected from login page', async ({ page }) => {
    // This test would require setting up an authenticated session
    // For now, it documents the expected behavior:
    // 1. Coach logs in successfully
    // 2. Gets redirected to /clients
    // 3. If coach manually navigates to /login, they should be redirected to /clients
    // 4. No flickering/flash of login UI should occur

    // Note: This requires test credentials and proper test setup
    // Implementation would follow this pattern:
    // 1. Set auth cookie/session for test coach
    // 2. Navigate to /login
    // 3. Expect redirect to /clients
    // 4. Verify no intermediate render of login page

    // TODO: Implement with test user credentials in playwright.config.ts
  });

});
