import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Integration tests for POST /api/clients/[clientId]/tracking
 *
 * These tests exercise the route handler in isolation by mocking the
 * infrastructure layer (auth, server actions) so no database is needed.
 */

// ── Mocks (must be declared before importing the module under test) ──────────

vi.mock('@/app/api/utils/auth', () => ({
  validateApiKey: vi.fn(),
}));

vi.mock('@/app/actions/clientActions', () => ({
  addDailyStep: vi.fn(),
  addDailyWeight: vi.fn(),
  addMeasurementEntries: vi.fn(),
}));

import { POST } from '@/app/api/clients/[clientId]/tracking/route';
import { validateApiKey } from '@/app/api/utils/auth';
import { addDailyStep, addDailyWeight, addMeasurementEntries } from '@/app/actions/clientActions';
import { NextRequest } from 'next/server';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown, apiKey?: string): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (apiKey !== undefined) headers['x-api-key'] = apiKey;

  return new NextRequest('http://localhost/api/clients/test-client/tracking', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

function makeRawRequest(rawBody: string, apiKey?: string): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (apiKey !== undefined) headers['x-api-key'] = apiKey;

  return new NextRequest('http://localhost/api/clients/test-client/tracking', {
    method: 'POST',
    headers,
    body: rawBody,
  });
}

const VALID_CLIENT_ID = 'test-client';
const VALID_API_KEY = 'valid-key-abc123';
const VALID_PARAMS = Promise.resolve({ clientId: VALID_CLIENT_ID });
const FAKE_CLIENT = { id: VALID_CLIENT_ID, name: 'Test' };

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/clients/[clientId]/tracking', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(validateApiKey).mockResolvedValue(true);
    vi.mocked(addDailyStep).mockResolvedValue(FAKE_CLIENT as any);
    vi.mocked(addDailyWeight).mockResolvedValue(FAKE_CLIENT as any);
    vi.mocked(addMeasurementEntries).mockResolvedValue(FAKE_CLIENT as any);
  });

  // ── Auth ──────────────────────────────────────────────────────────────────

  it('REQ-UTA-02: should return 401 when X-API-Key header is missing', async () => {
    const req = makeRequest({ date: '2026-04-19', steps: 5000 }); // no apiKey arg
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Missing X-API-Key');
  });

  it('REQ-UTA-02: should return 403 when API key is invalid for the client', async () => {
    vi.mocked(validateApiKey).mockResolvedValue(false);

    const req = makeRequest({ date: '2026-04-19', steps: 5000 }, 'wrong-key');
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Invalid or mismatched API key');
  });

  // ── Validation ────────────────────────────────────────────────────────────

  it('REQ-UTA-03: should return 400 when both steps and weight are absent', async () => {
    const req = makeRequest({ date: '2026-04-19' }, VALID_API_KEY);
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });

  it('REQ-UTA-03: should return 400 for an invalid date string', async () => {
    const req = makeRequest({ date: 'not-a-date', steps: 5000 }, VALID_API_KEY);
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(400);
  });

  it('REQ-UTA-03: should return 400 when steps exceed maximum (100000)', async () => {
    const req = makeRequest({ date: '2026-04-19', steps: 200000 }, VALID_API_KEY);
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(400);
  });

  it('REQ-UTA-03: should return 400 when weight is below minimum (0.1)', async () => {
    const req = makeRequest({ date: '2026-04-19', weight: 0.05 }, VALID_API_KEY);
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(400);
  });

  // ── Malformed body (Bug 1 regression) ─────────────────────────────────────

  it('should return 400 (not 500) when the body is empty', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = makeRawRequest('', VALID_API_KEY);
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid JSON body');
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('should return 400 (not 500) when the body is malformed/truncated JSON', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = makeRawRequest('{"date": "2026-07-13", "steps":', VALID_API_KEY);
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid JSON body');
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it('should log diagnostic details (raw body and content-type) when JSON parsing fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = makeRawRequest('not-json-at-all', VALID_API_KEY);
    await POST(req, { params: VALID_PARAMS });

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('tracking'),
      expect.objectContaining({
        rawBody: 'not-json-at-all',
        contentType: 'application/json',
      })
    );

    errorSpy.mockRestore();
  });

  // ── Dispatch ──────────────────────────────────────────────────────────────

  it('REQ-UTA-04: should accept steps only and call addDailyStep', async () => {
    const req = makeRequest({ date: '2026-04-19', steps: 8000 }, VALID_API_KEY);
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(200);
    expect(vi.mocked(addDailyStep)).toHaveBeenCalledOnce();
    expect(vi.mocked(addDailyWeight)).not.toHaveBeenCalled();

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.steps).toBe(8000);
    expect(body.data.weight).toBeUndefined();
  });

  it('REQ-UTA-04: should accept weight only and call addDailyWeight', async () => {
    const req = makeRequest({ date: '2026-04-19', weight: 80.5 }, VALID_API_KEY);
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(200);
    expect(vi.mocked(addDailyWeight)).toHaveBeenCalledOnce();
    expect(vi.mocked(addDailyStep)).not.toHaveBeenCalled();

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.weight).toBe(80.5);
    expect(body.data.steps).toBeUndefined();
  });

  it('REQ-UTA-04: should accept both steps and weight and call both actions', async () => {
    const req = makeRequest(
      { date: '2026-04-19', steps: 10000, weight: 79.3 },
      VALID_API_KEY
    );
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(200);
    expect(vi.mocked(addDailyStep)).toHaveBeenCalledOnce();
    expect(vi.mocked(addDailyWeight)).toHaveBeenCalledOnce();

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.steps).toBe(10000);
    expect(body.data.weight).toBe(79.3);
  });

  it('should return 404 when client is not found', async () => {
    vi.mocked(addDailyStep).mockResolvedValue(null);

    const req = makeRequest({ date: '2026-04-19', steps: 5000 }, VALID_API_KEY);
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Client not found');
  });

  it('should include notes in the response when provided', async () => {
    const req = makeRequest(
      { date: '2026-04-19', steps: 5000, notes: 'Morning walk' },
      VALID_API_KEY
    );
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.notes).toBe('Morning walk');
  });

  // ── Measurements Extension (REQ-BMT-07 / unified-tracking-api delta) ──────

  it('REQ-UTA-BMT-01: should accept measurements-only and call addMeasurementEntries', async () => {
    const req = makeRequest(
      {
        date: '2026-04-19',
        measurements: [
          { pointSlug: 'cintura', valueCm: 85 },
          { pointSlug: 'pecho', valueCm: 100 },
        ],
      },
      VALID_API_KEY
    );
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(200);
    expect(vi.mocked(addMeasurementEntries)).toHaveBeenCalledOnce();
    expect(vi.mocked(addDailyStep)).not.toHaveBeenCalled();

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.measurements).toBe(2);
  });

  it('REQ-UTA-BMT-02: should accept combined steps+measurements and call both actions', async () => {
    const req = makeRequest(
      {
        date: '2026-04-19',
        steps: 8000,
        measurements: [{ pointSlug: 'cintura', valueCm: 85 }],
      },
      VALID_API_KEY
    );
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(200);
    expect(vi.mocked(addDailyStep)).toHaveBeenCalledOnce();
    expect(vi.mocked(addMeasurementEntries)).toHaveBeenCalledOnce();

    const body = await res.json();
    expect(body.data.steps).toBe(8000);
    expect(body.data.measurements).toBe(1);
  });

  it('REQ-UTA-BMT-03: should return 400 when all three fields are absent', async () => {
    const req = makeRequest({ date: '2026-04-19' }, VALID_API_KEY);
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Validation failed');
  });

  it('REQ-UTA-BMT-04: should return 400 when measurements array is empty', async () => {
    const req = makeRequest(
      { date: '2026-04-19', measurements: [] },
      VALID_API_KEY
    );
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(400);
  });

  it('REQ-UTA-BMT-05: legacy steps-only still returns 200 (regression guard)', async () => {
    const req = makeRequest({ date: '2026-04-19', steps: 5000 }, VALID_API_KEY);
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(200);
    expect(vi.mocked(addMeasurementEntries)).not.toHaveBeenCalled();
    const body = await res.json();
    expect(body.data.steps).toBe(5000);
  });

  it('REQ-UTA-BMT-06: should return 400 when addMeasurementEntries throws (unknown slug or out-of-range)', async () => {
    vi.mocked(addMeasurementEntries).mockRejectedValue(
      new Error('Point "unknown-slug" is not configured for this client')
    );

    const req = makeRequest(
      { date: '2026-04-19', measurements: [{ pointSlug: 'unknown-slug', valueCm: 85 }] },
      VALID_API_KEY
    );
    const res = await POST(req, { params: VALID_PARAMS });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('unknown-slug');
  });
});
