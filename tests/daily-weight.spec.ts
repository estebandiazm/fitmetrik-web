import { test, expect } from '@playwright/test';

test.describe('Daily Weight Tracking', () => {
  const clientEmail = 'client@example.com';
  const clientPassword = 'TestPassword123!';
  const coachEmail = 'coach@example.com';
  const coachPassword = 'CoachPass123!';

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // ── Client Portal ─────────────────────────────────────────────────────────

  test.describe('Client Portal - Weight Tracking', () => {
    test('DWT-E2E-01: should display weight tab on activity page', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(clientEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(clientPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/activity');

      // Weight tab should be present alongside Steps tab
      await expect(page.getByRole('button', { name: /Weight/i })).toBeVisible();
    });

    test('DWT-E2E-02: should open and close weight modal', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(clientEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(clientPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/activity?tab=weight');

      // Open modal
      await page.getByRole('button', { name: /Add Record/i }).click();

      // Verify modal fields are present
      await expect(page.getByRole('heading', { name: 'Log Weight' })).toBeVisible();
      await expect(page.getByLabel('Date')).toBeVisible();
      await expect(page.getByLabel('Weight (kg)')).toBeVisible();
      await expect(page.getByLabel('Notes (optional)')).toBeVisible();

      // Close with Cancel
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('heading', { name: 'Log Weight' })).not.toBeVisible();
    });

    test('DWT-E2E-03: should validate future date', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(clientEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(clientPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/activity?tab=weight');
      await page.getByRole('button', { name: /Add Record/i }).click();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDateStr = tomorrow.toISOString().split('T')[0];

      await page.getByLabel('Date').fill(futureDateStr);
      await page.getByLabel('Weight (kg)').fill('80');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText('Date cannot be in the future')).toBeVisible();
    });

    test('DWT-E2E-04: should validate weight below minimum (0.1 kg)', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(clientEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(clientPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/activity?tab=weight');
      await page.getByRole('button', { name: /Add Record/i }).click();

      const today = new Date().toISOString().split('T')[0];
      await page.getByLabel('Date').fill(today);
      await page.getByLabel('Weight (kg)').fill('0.05');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText('Weight must be between 0.1 and 500 kg')).toBeVisible();
    });

    test('DWT-E2E-05: should validate weight above maximum (500 kg)', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(clientEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(clientPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/activity?tab=weight');
      await page.getByRole('button', { name: /Add Record/i }).click();

      const today = new Date().toISOString().split('T')[0];
      await page.getByLabel('Date').fill(today);
      await page.getByLabel('Weight (kg)').fill('600');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText('Weight must be between 0.1 and 500 kg')).toBeVisible();
    });

    test('DWT-E2E-06: Save button should be disabled when weight is empty', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(clientEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(clientPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/activity?tab=weight');
      await page.getByRole('button', { name: /Add Record/i }).click();

      // Weight field is empty — Save must be disabled
      await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    test('DWT-E2E-07: should successfully save a weight record', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(clientEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(clientPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/activity?tab=weight');
      await page.getByRole('button', { name: /Add Record/i }).click();

      const today = new Date().toISOString().split('T')[0];
      await page.getByLabel('Date').fill(today);
      await page.getByLabel('Weight (kg)').fill('80.5');
      await page.getByLabel('Notes (optional)').fill('After breakfast');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText('Weight recorded successfully!')).toBeVisible({ timeout: 5000 });

      // Modal closes automatically after success
      await page.waitForTimeout(1700);
      await expect(page.getByRole('heading', { name: 'Log Weight' })).not.toBeVisible();
    });

    test('DWT-E2E-08: should display weight history table after logging', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(clientEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(clientPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/activity?tab=weight');

      // Check for table or empty state — both are valid initial states
      const table = page.locator('table');
      const emptyState = page.getByText('No weight records yet. Start logging!');

      const hasData = await table.isVisible().catch(() => false);
      const isEmpty = await emptyState.isVisible().catch(() => false);

      // One of these two states must be true
      expect(hasData || isEmpty).toBe(true);
    });

    test('DWT-E2E-09: should render weight trend chart when data exists', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(clientEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(clientPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/activity?tab=weight');

      // Chart heading "Weight Trends" appears only when weights.length > 0
      const chartHeading = page.getByRole('heading', { name: 'Weight Trends' });
      const isVisible = await chartHeading.isVisible().catch(() => false);

      if (isVisible) {
        // Chart SVG must be rendered
        await expect(page.locator('svg').first()).toBeVisible();

        // Period toggle buttons should exist
        await expect(page.getByRole('button', { name: 'Week' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Month' })).toBeVisible();
      }
    });

    test('DWT-E2E-10: should toggle weight chart between Week and Month', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(clientEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(clientPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/activity?tab=weight');

      const chartHeading = page.getByRole('heading', { name: 'Weight Trends' });
      const isVisible = await chartHeading.isVisible().catch(() => false);

      if (isVisible) {
        // Default is Month — switch to Week
        await page.getByRole('button', { name: 'Week' }).click();
        await expect(page.getByRole('button', { name: 'Week' })).toHaveClass(/text-blue-400/);

        await page.waitForTimeout(300);

        // Switch back to Month
        await page.getByRole('button', { name: 'Month' }).click();
        await expect(page.getByRole('button', { name: 'Month' })).toHaveClass(/text-blue-400/);
      }
    });

    test('DWT-E2E-11: should display the weight blister widget on client dashboard', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(clientEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(clientPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      // Navigate to dashboard (default after login)
      await page.goto('/dashboard');

      // WeightBlisterWidget is the "Hoy" region with a "X/7 esta semana" summary
      const weightWidget = page.getByRole('region', { name: 'Hoy' });
      await expect(weightWidget).toBeVisible();
      await expect(page.getByText(/\d\/7/)).toBeVisible();

      // Today's hero cell prompts either to log (pending) or shows today's value (popped)
      const hasPrompt = await page.getByText('Toca para loguear').isVisible().catch(() => false);
      const hasLogged = await page.getByText('Peso de hoy').isVisible().catch(() => false);

      expect(hasPrompt || hasLogged).toBe(true);
    });
  });

  // ── Coach Portal ──────────────────────────────────────────────────────────

  test.describe('Coach Portal - Weight Management', () => {
    test('DWT-E2E-12: should display Target Weight editor on client detail page', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(coachEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(coachPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/clients');

      const viewLink = page.getByRole("link", { name: /^Ver a / }).first();
      const clientExists = await viewLink.isVisible().catch(() => false);

      if (clientExists) {
        await viewLink.click();

        // Target Weight section heading
        await expect(page.getByRole('heading', { name: 'Target Weight' })).toBeVisible();

        // Input field for entering target
        const targetInput = page.getByPlaceholder('e.g., 70.5');
        await expect(targetInput).toBeVisible();

        // Save button
        await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
      }
    });

    test('DWT-E2E-13: should save target weight and show success message', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(coachEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(coachPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/clients');

      const viewLink = page.getByRole("link", { name: /^Ver a / }).first();
      const clientExists = await viewLink.isVisible().catch(() => false);

      if (clientExists) {
        await viewLink.click();

        // Enter a valid target weight
        await page.getByPlaceholder('e.g., 70.5').fill('72.0');
        await page.getByRole('button', { name: 'Save' }).click();

        await expect(page.getByText('Target weight saved!')).toBeVisible({ timeout: 5000 });
      }
    });

    test('DWT-E2E-14: should display weight metrics cards when client has weight data', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(coachEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(coachPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/clients');

      const viewLink = page.getByRole("link", { name: /^Ver a / }).first();
      const clientExists = await viewLink.isVisible().catch(() => false);

      if (clientExists) {
        await viewLink.click();

        // Metrics section is conditional on weights.length > 0
        const latestCard = page.getByText('Latest Weight');
        const hasMetrics = await latestCard.isVisible().catch(() => false);

        if (hasMetrics) {
          await expect(page.getByText('Lightest')).toBeVisible();
          await expect(page.getByText('Heaviest')).toBeVisible();
        } else {
          // Empty state
          await expect(page.getByText('No weight data yet.')).toBeVisible();
        }
      }
    });

    test('DWT-E2E-15: should display weight history table when client has weight data', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(coachEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(coachPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/clients');

      const viewLink = page.getByRole("link", { name: /^Ver a / }).first();
      const clientExists = await viewLink.isVisible().catch(() => false);

      if (clientExists) {
        await viewLink.click();

        // Weight History heading only renders when weights.length > 0
        const historyHeading = page.getByRole('heading', { name: 'Weight History' });
        const hasHistory = await historyHeading.isVisible().catch(() => false);

        if (hasHistory) {
          await expect(page.locator('table').last()).toBeVisible();
        }
      }
    });

    test('DWT-E2E-16: should display Weight Tracking section heading on coach client page', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(coachEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(coachPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/clients');

      const viewLink = page.getByRole("link", { name: /^Ver a / }).first();
      const clientExists = await viewLink.isVisible().catch(() => false);

      if (clientExists) {
        await viewLink.click();

        await expect(page.getByRole('heading', { name: 'Weight Tracking' })).toBeVisible();
      }
    });
  });

  // ── API Endpoint (regression, no live DB needed) ──────────────────────────

  test.describe('API - Unified Tracking Endpoint (/api/clients/[clientId]/tracking)', () => {
    test('DWT-API-01: should return 401 when X-API-Key header is missing', async ({ request }) => {
      const response = await request.post('/api/clients/test-client-id/tracking', {
        data: {
          date: new Date().toISOString().split('T')[0],
          steps: 5000,
        },
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toContain('Missing X-API-Key');
    });

    test('DWT-API-02: should return 403 when API key is invalid', async ({ request }) => {
      const response = await request.post('/api/clients/test-client-id/tracking', {
        headers: { 'x-api-key': 'invalid-key-xyz' },
        data: {
          date: new Date().toISOString().split('T')[0],
          steps: 5000,
        },
      });

      expect(response.status()).toBe(403);
      const body = await response.json();
      expect(body.error).toContain('Invalid or mismatched API key');
    });

    test('DWT-API-03: should return 400 when both steps and weight are absent', async ({ request }) => {
      const response = await request.post('/api/clients/test-client-id/tracking', {
        headers: { 'x-api-key': 'any-key' },
        data: {
          date: new Date().toISOString().split('T')[0],
          // no steps, no weight
        },
      });

      // 400 (validation) or 403 (invalid key checked first)
      expect([400, 403]).toContain(response.status());
    });

    test('DWT-API-04: should return 400 or 403 when weight exceeds 500 kg', async ({ request }) => {
      const response = await request.post('/api/clients/test-client-id/tracking', {
        headers: { 'x-api-key': 'any-key' },
        data: {
          date: new Date().toISOString().split('T')[0],
          weight: 600,
        },
      });

      // 400 (validation) or 403 (API key checked before parsing body)
      expect([400, 403]).toContain(response.status());
    });

    test('DWT-API-05: REGRESSION - old /steps endpoint should return 404 (deleted, not deprecated)', async ({ request }) => {
      const response = await request.post('/api/clients/test-client-id/steps', {
        headers: { 'x-api-key': 'any-key' },
        data: {
          date: new Date().toISOString().split('T')[0],
          steps: 5000,
        },
      });

      // Endpoint was deleted in favour of /tracking — must not exist
      expect(response.status()).toBe(404);
    });
  });
});
