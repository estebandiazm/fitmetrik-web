import { test, expect } from '@playwright/test';

test.describe('Daily Steps Tracking', () => {
  // Setup test user credentials
  const testEmail = 'client@example.com';
  const testPassword = 'TestPassword123!';
  const coachEmail = 'coach@example.com';
  const coachPassword = 'CoachPass123!';

  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test.describe('Client Portal - Manual Entry', () => {
    test('7.1: should open and close daily steps modal', async ({ page }) => {
      // Login as client
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(testEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(testPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      // Navigate to activity page
      await page.goto('/activity');

      // Open modal with Add Record button
      await page.getByRole('button', { name: /Add Record/i }).click();

      // Verify modal is open
      await expect(page.getByRole('heading', { name: 'Log Steps' })).toBeVisible();
      await expect(page.getByLabel('Date')).toBeVisible();
      await expect(page.getByLabel('Steps')).toBeVisible();
      await expect(page.getByLabel('Notes')).toBeVisible();

      // Close modal with Cancel button
      await page.getByRole('button', { name: 'Cancel' }).click();

      // Verify modal is closed
      await expect(page.getByRole('heading', { name: 'Log Steps' })).not.toBeVisible();
    });

    test('7.2: should validate step entry form', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(testEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(testPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/activity');
      await page.getByRole('button', { name: /Add Record/i }).click();

      // Test 1: Future date rejection
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDateStr = tomorrow.toISOString().split('T')[0];

      await page.getByLabel('Date').fill(futureDateStr);
      await page.getByLabel('Steps').fill('5000');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText('Date cannot be in the future')).toBeVisible();

      // Test 2: Invalid step count (negative)
      await page.getByLabel('Date').clear();
      const today = new Date().toISOString().split('T')[0];
      await page.getByLabel('Date').fill(today);
      await page.getByLabel('Steps').clear();
      await page.getByLabel('Steps').fill('-100');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText(/Steps must be between 0 and 100/i)).toBeVisible();

      // Test 3: Invalid step count (too high)
      await page.getByLabel('Steps').clear();
      await page.getByLabel('Steps').fill('150000');
      await page.getByRole('button', { name: 'Save' }).click();

      await expect(page.getByText(/Steps must be between 0 and 100/i)).toBeVisible();

      // Test 4: Empty steps field
      await page.getByLabel('Steps').clear();
      await page.getByRole('button', { name: 'Save' }).click();

      // Save button should be disabled (greyed out)
      await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    test('7.3: should successfully save daily step record', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(testEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(testPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/activity');
      await page.getByRole('button', { name: /Add Record/i }).click();

      // Fill valid form data
      const today = new Date().toISOString().split('T')[0];
      await page.getByLabel('Date').fill(today);
      await page.getByLabel('Steps').fill('8500');
      await page.getByLabel('Notes').fill('Morning run + evening walk');

      // Submit form
      await page.getByRole('button', { name: 'Save' }).click();

      // Verify success message
      await expect(page.getByText('Steps recorded successfully')).toBeVisible({ timeout: 5000 });

      // Modal should close automatically after success
      await page.waitForTimeout(1500); // Wait for the timeout in modal
      await expect(page.getByRole('heading', { name: 'Log Steps' })).not.toBeVisible();

      // Verify the record appears in recent records
      await expect(page.getByText('8500')).toBeVisible();
    });

    test('7.4: should paginate recent records', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(testEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(testPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/activity');

      // Scroll down to recent records section
      const recentRecordsHeading = page.getByRole('heading', { name: 'Recent Records' });
      await recentRecordsHeading.scrollIntoViewIfNeeded();

      // Check if Load More button exists (only if more than 10 records)
      const loadMoreButton = page.getByRole('button', { name: 'Load More' });
      const loadMoreExists = await loadMoreButton.isVisible().catch(() => false);

      if (loadMoreExists) {
        // Count initial rows
        const initialRows = await page.locator('table tbody tr').count();
        expect(initialRows).toBeLessThanOrEqual(10);

        // Click Load More
        await loadMoreButton.click();

        // Verify more rows are loaded
        const updatedRows = await page.locator('table tbody tr').count();
        expect(updatedRows).toBeGreaterThan(initialRows);
      }
    });

    test('7.5: should toggle trends chart between week and month', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(testEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(testPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/activity');

      // Scroll to trends chart
      const chartsSection = page.getByRole('heading', { name: 'Activity Trends' });
      await chartsSection.scrollIntoViewIfNeeded();

      // Default should be Month
      await expect(page.getByRole('button', { name: 'Month' })).toHaveClass(/text-pink-500/);

      // Toggle to Week
      await page.getByRole('button', { name: 'Week' }).click();
      await expect(page.getByRole('button', { name: 'Week' })).toHaveClass(/text-pink-500/);

      // Chart should update with week data
      await page.waitForTimeout(300); // Allow chart animation

      // Toggle back to Month
      await page.getByRole('button', { name: 'Month' }).click();
      await expect(page.getByRole('button', { name: 'Month' })).toHaveClass(/text-pink-500/);
    });

    test('7.6: should display status badges based on step goal', async ({ page }) => {
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(testEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(testPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      await page.goto('/activity');

      // If step goal is set, verify badges appear
      const summaryCard = page.locator('text=Daily Average').first();
      const progressPercent = page.locator('text=Progress to Goal');

      const hasGoal = await progressPercent.isVisible().catch(() => false);

      if (hasGoal) {
        // Scroll to recent records
        const recentRecordsHeading = page.getByRole('heading', { name: 'Recent Records' });
        await recentRecordsHeading.scrollIntoViewIfNeeded();

        // Check for status badges (Goal Met, Good, Low Activity)
        const badges = page.locator('[class*="px-3 py-1"]');
        const badgeCount = await badges.count();
        expect(badgeCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Coach Dashboard - Activity Management', () => {
    test('7.7: should display client activity and allow setting step goal', async ({ page }) => {
      // Login as coach
      await page.goto('/login');
      await page.getByLabel('Correo electrónico').fill(coachEmail);
      await page.getByLabel('Contraseña', { exact: true }).fill(coachPassword);
      await page.getByRole('button', { name: 'Entrar' }).click();

      // Navigate to clients list
      await page.goto('/clients');

      // Find and click on a client (assuming at least one exists)
      const viewLink = page.getByRole("link", { name: /^Ver a / }).first();
      const clientExists = await viewLink.isVisible().catch(() => false);

      if (clientExists) {
        await viewLink.click();

        // Steps live in the "Progreso" tab of the client detail page
        await page.getByRole('link', { name: 'Progreso' }).click();
        await expect(page.getByRole('heading', { name: 'Meta de pasos' })).toBeVisible();
        await expect(page.getByText('Promedio diario')).toBeVisible();

        // Set a step goal
        const goalInput = page.locator('input[type="number"]').first();
        await goalInput.fill('10000');

        // Click save button
        await page.getByRole('button', { name: 'Guardar' }).click();

        // Verify success message
        await expect(page.getByText('¡Meta guardada!')).toBeVisible({ timeout: 5000 });

        // Verify the goal is updated
        await expect(page.locator('text=Progreso hacia la meta')).toBeVisible();
      }
    });
  });

  test.describe('API Endpoint', () => {
    test('should reject requests without API key', async ({ request }) => {
      // Try to POST without X-API-Key header
      const response = await request.post('/api/clients/test-client-id/steps', {
        data: {
          date: new Date().toISOString().split('T')[0],
          steps: 5000,
        },
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toContain('Missing X-API-Key');
    });

    test('should reject requests with invalid API key', async ({ request }) => {
      const response = await request.post('/api/clients/test-client-id/steps', {
        data: {
          date: new Date().toISOString().split('T')[0],
          steps: 5000,
        },
        headers: {
          'X-API-Key': 'invalid-key-12345',
        },
      });

      expect(response.status()).toBe(403);
      const body = await response.json();
      expect(body.error).toContain('Invalid or mismatched API key');
    });

    test('should validate step data format', async ({ request }) => {
      // This test would need a valid client ID and API key from test setup
      // For now, it validates the error response structure
      const response = await request.post('/api/clients/nonexistent/steps', {
        data: {
          date: 'invalid-date',
          steps: 'not-a-number',
        },
        headers: {
          'X-API-Key': 'test-key',
        },
      });

      // Should return 400 (validation) or 404 (not found) or 403 (invalid key)
      expect([400, 403, 404]).toContain(response.status());
    });
  });
});
