import { test, expect, Page } from '@playwright/test';

/**
 * E2E tests for Body Measurements Tracking feature.
 * REQ-BMT-01: Coach configures measurement points per client.
 * REQ-BMT-02: Client logs measurements (batch entry).
 * REQ-BMT-03: Body diagram point selector.
 * REQ-BMT-04: Measurement trends chart.
 * REQ-BMT-05: Measurement history table.
 * REQ-BMT-06: Measurements tab on activity page.
 * REQ-BMT-07: Validation ranges enforced at API boundary.
 */

// ── Page Object Models ────────────────────────────────────────────────────────

class AuthPage {
  constructor(private page: Page) {}

  async loginAsCoach() {
    await this.page.goto('/login');
    await this.page.getByLabel('Email').fill('coach@example.com');
    await this.page.getByLabel('Password').fill('CoachPass123!');
    await this.page.getByRole('button', { name: 'Sign In' }).click();
    await this.page.waitForURL('/clients');
  }

  async loginAsClient() {
    await this.page.goto('/login');
    await this.page.getByLabel('Email').fill('client@example.com');
    await this.page.getByLabel('Password').fill('TestPassword123!');
    await this.page.getByRole('button', { name: 'Sign In' }).click();
    await this.page.waitForURL('/activity');
  }
}

class CoachClientDetailPage {
  constructor(private page: Page) {}

  async goto(clientId: string) {
    await this.page.goto(`/clients/${clientId}`);
  }

  async toggleMeasurementPoint(slug: string) {
    await this.page
      .getByTestId(`measurement-point-toggle-${slug}`)
      .click();
  }

  async saveMeasurementPoints() {
    await this.page
      .getByTestId('measurement-points-editor')
      .getByRole('button', { name: /save/i })
      .click();
  }

  async expectPointActive(slug: string) {
    const toggle = this.page.getByTestId(`measurement-point-toggle-${slug}`);
    await expect(toggle).toBeChecked();
  }

  async expectEditorVisible() {
    await expect(
      this.page.getByTestId('measurement-points-editor')
    ).toBeVisible();
  }
}

class ActivityPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/activity');
  }

  async switchToMeasurementsTab() {
    await this.page.getByTestId('activity-tab-measurements').click();
  }

  async fillMeasurementInput(slug: string, value: number) {
    // The grouped tile grid renders a `type="text" inputMode="decimal"` field
    // (sanitized on change) per point, keyed by the same test id.
    const input = this.page.getByTestId(`add-measurement-input-${slug}`);
    await input.click();
    await input.fill(String(value));
  }

  async stepMeasurementInput(slug: string, direction: 'up' | 'down') {
    const label = direction === 'up' ? /^Sumar 0\.5/ : /^Restar 0\.5/;
    await this.page
      .getByTestId(`add-measurement-input-${slug}`)
      .locator('xpath=..')
      .getByRole('button', { name: label })
      .click();
  }

  async submitMeasurements() {
    await this.page.getByTestId('add-measurement-submit').click();
  }

  async openAddMeasurementModal() {
    await this.page.getByRole('button', { name: /Add Record/i }).click();
    await expect(
      this.page.getByTestId('add-measurement-modal')
    ).toBeVisible();
  }

  async getHistoryRowCount(): Promise<number> {
    return this.page
      .getByTestId(/^measurement-history-row-\d+$/)
      .count();
  }

  async clickBodyDiagramHotspot(slug: string) {
    await this.page.getByTestId(`body-diagram-point-${slug}`).click();
  }

  async selectChartPoint(slug: string) {
    await this.page
      .getByTestId('measurement-trends-chart')
      .getByRole('combobox')
      .selectOption(slug);
  }
}

// ── Test Credentials & Config ─────────────────────────────────────────────────

const COACH_CLIENT_ID = process.env.TEST_CLIENT_ID ?? 'test-client-id';

// ── Coach Flow Tests (REQ-BMT-01) ────────────────────────────────────────────

test.describe('Coach: Measurement Points Configuration (REQ-BMT-01)', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('BMT-E2E-01: coach sees MeasurementPointsEditor on client detail page', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.loginAsCoach();

    // Navigate to first client - get the client ID from the roster
    await page.goto('/clients');
    const firstClientLink = page.locator('table a, [data-testid="client-row"] a').first();
    await firstClientLink.click();

    const coachPage = new CoachClientDetailPage(page);
    await coachPage.expectEditorVisible();
  });

  test('BMT-E2E-02: coach can toggle a measurement point on and save it', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.loginAsCoach();

    await page.goto('/clients');
    const firstClientLink = page.locator('table a, [data-testid="client-row"] a').first();
    const href = await firstClientLink.getAttribute('href');
    await firstClientLink.click();

    const coachPage = new CoachClientDetailPage(page);
    await coachPage.expectEditorVisible();

    // Toggle cintura ON
    await coachPage.toggleMeasurementPoint('cintura');
    await coachPage.saveMeasurementPoints();

    // Wait for success feedback
    await expect(
      page.locator('text=saved, text=guardado').or(
        page.getByText('saved', { exact: false })
      )
    ).toBeVisible({ timeout: 5000 });
  });
});

// ── Client Flow Tests (REQ-BMT-02, REQ-BMT-06) ───────────────────────────────

test.describe('Client: Measurements Tab (REQ-BMT-06)', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('BMT-E2E-03: measurements tab is visible on activity page', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.loginAsClient();

    const activityPage = new ActivityPage(page);
    await activityPage.goto();

    await expect(page.getByTestId('activity-tab-measurements')).toBeVisible();
  });

  test('BMT-E2E-04: switching to measurements tab shows the tab content', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.loginAsClient();

    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await activityPage.switchToMeasurementsTab();

    // Either body diagram or empty state should be visible
    const hasDiagram = await page.getByTestId('body-diagram').isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=Sin puntos, text=no active').isVisible().catch(() => false);
    expect(hasDiagram || hasEmptyState).toBe(true);
  });
});

// ── API Route Tests (REQ-BMT-07 / unified-tracking-api) ──────────────────────
// These live in tests/unit/api/tracking.spec.ts (Vitest) for the extension.
// Playwright smoke test for measurements-only POST via fetch:

test.describe('API: Tracking route measurements extension (REQ-BMT-07)', () => {
  test('BMT-API-01: POST /api/clients/[clientId]/tracking with measurements[] returns 200', async ({ request }) => {
    const clientId = COACH_CLIENT_ID;
    // This test will fail (RED) until Phase 3 implements the measurements field.
    const apiKey = process.env.TEST_API_KEY ?? 'test-api-key';

    const response = await request.post(
      `/api/clients/${clientId}/tracking`,
      {
        headers: { 'x-api-key': apiKey },
        data: {
          date: '2026-01-01',
          measurements: [
            { pointSlug: 'cintura', valueCm: 85 },
          ],
        },
      }
    );

    // Should be 200 once implemented; RED state returns 400 (validation fails: at least steps or weight required)
    expect(response.status()).toBe(200);
  });
});

// ── Shared Modal/Overlay Primitive (ui-design-system) ────────────────────────
// `AddMeasurementModal` is the first adopter of `src/components/ui/Modal.tsx`.
// These cover the 7 `ui-design-system` "Shared Modal/Overlay Primitive"
// scenarios through that adopter. They stay `test.fixme` until the Body
// Measurements E2E fixtures (seeded client, active points, auth) land — a
// documented follow-up, NOT a merge gate for this change. See
// openspec/changes/measurement-input-redesign/design.md (Testing Strategy).

test.describe('ui/Modal primitive via AddMeasurementModal (ui-design-system)', () => {
  test.fixme('renders as a bottom-sheet on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const auth = new AuthPage(page);
    await auth.loginAsClient();
    const activity = new ActivityPage(page);
    await activity.goto();
    await activity.switchToMeasurementsTab();
    await activity.openAddMeasurementModal();

    const panel = page.getByTestId('add-measurement-modal');
    const panelBox = await panel.boundingBox();
    const viewport = page.viewportSize();
    // Anchored to the bottom edge, full-width.
    expect(panelBox && viewport && panelBox.y + panelBox.height).toBeCloseTo(viewport!.height, 0);
    expect(panelBox && viewport && panelBox.width).toBeCloseTo(viewport!.width, 0);
  });

  test.fixme('renders as a centered dialog on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const auth = new AuthPage(page);
    await auth.loginAsClient();
    const activity = new ActivityPage(page);
    await activity.goto();
    await activity.switchToMeasurementsTab();
    await activity.openAddMeasurementModal();

    const panel = page.getByTestId('add-measurement-modal');
    const panelBox = await panel.boundingBox();
    const viewport = page.viewportSize();
    const centerY = panelBox!.y + panelBox!.height / 2;
    expect(Math.abs(centerY - viewport!.height / 2)).toBeLessThan(24);
    expect(panelBox!.width).toBeLessThan(viewport!.width);
  });

  test.fixme('Escape closes and restores focus to the trigger', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.loginAsClient();
    const activity = new ActivityPage(page);
    await activity.goto();
    await activity.switchToMeasurementsTab();
    const trigger = page.getByRole('button', { name: /Add Record/i });
    await trigger.click();
    await expect(page.getByTestId('add-measurement-modal')).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByTestId('add-measurement-modal')).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test.fixme('backdrop click closes the overlay', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.loginAsClient();
    const activity = new ActivityPage(page);
    await activity.goto();
    await activity.switchToMeasurementsTab();
    await activity.openAddMeasurementModal();

    // Click the top-left corner of the viewport — outside the panel.
    await page.mouse.click(5, 5);

    await expect(page.getByTestId('add-measurement-modal')).toBeHidden();
  });

  test.fixme('focus is trapped and wraps within the overlay', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.loginAsClient();
    const activity = new ActivityPage(page);
    await activity.goto();
    await activity.switchToMeasurementsTab();
    await activity.openAddMeasurementModal();

    const panel = page.getByTestId('add-measurement-modal');
    // Tab many times — focus must never leave the panel subtree.
    for (let i = 0; i < 25; i += 1) {
      await page.keyboard.press('Tab');
      const focusInsidePanel = await panel.evaluate((el) => el.contains(document.activeElement));
      expect(focusInsidePanel).toBe(true);
    }
  });

  test.fixme('body scroll is locked while open and restored on close', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.loginAsClient();
    const activity = new ActivityPage(page);
    await activity.goto();
    await activity.switchToMeasurementsTab();

    const before = await page.evaluate(() => document.body.style.overflow);
    await activity.openAddMeasurementModal();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('add-measurement-modal')).toBeHidden();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe(before);
  });

  test.fixme('portaled overlay preserves the client surface scope', async ({ page }) => {
    const auth = new AuthPage(page);
    await auth.loginAsClient();
    const activity = new ActivityPage(page);
    await activity.goto();
    await activity.switchToMeasurementsTab();
    await activity.openAddMeasurementModal();

    // The portal root is a direct child of <body>; it must carry .surface-client.
    const scopedRoots = await page
      .locator('body > div.surface-client')
      .count();
    expect(scopedRoots).toBeGreaterThan(0);
  });
});
