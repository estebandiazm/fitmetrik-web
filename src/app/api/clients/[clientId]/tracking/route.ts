import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateApiKey } from '../../../../../app/api/utils/auth';
import { addDailyStep, addDailyWeight, addMeasurementEntries } from '../../../../../app/actions/clientActions';

const MeasurementEntrySchema = z.object({
  pointSlug: z.string().min(1),
  valueCm: z.number().positive().max(300),
  notes: z.string().max(500).optional(),
});

const TrackingEntrySchema = z
  .object({
    date: z.coerce.date(),
    steps: z.number().int().min(0).max(100000).optional(),
    weight: z.number().min(0.1).max(500).optional(),
    measurements: z.array(MeasurementEntrySchema).optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) =>
      data.steps !== undefined ||
      data.weight !== undefined ||
      (data.measurements !== undefined && data.measurements.length > 0),
    { message: 'At least steps, weight, or measurements must be provided' }
  );

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    const apiKey = request.headers.get('x-api-key');

    // Validate API key header exists
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing X-API-Key header' },
        { status: 401 }
      );
    }

    // Validate API key matches client
    const isValid = await validateApiKey(clientId, apiKey);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or mismatched API key' },
        { status: 403 }
      );
    }

    // Parse and validate body
    const rawBody = await request.text();

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch (err) {
      console.error('[tracking] Invalid JSON body received', {
        clientId,
        contentType: request.headers.get('content-type'),
        contentLength: request.headers.get('content-length'),
        rawBody,
        error: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = TrackingEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const entry = parsed.data;
    const results: { steps?: unknown; weight?: unknown; measurements?: unknown } = {};

    // Dispatch to the appropriate action(s) based on what is present in the request
    if (entry.steps !== undefined) {
      const stepsResult = await addDailyStep(
        clientId,
        entry.date,
        entry.steps,
        entry.notes
      );
      if (!stepsResult) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      results.steps = entry.steps;
    }

    if (entry.weight !== undefined) {
      const weightResult = await addDailyWeight(
        clientId,
        entry.date,
        entry.weight,
        entry.notes
      );
      if (!weightResult) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      results.weight = entry.weight;
    }

    if (entry.measurements && entry.measurements.length > 0) {
      try {
        const built = entry.measurements.map((m) => ({
          date: entry.date,
          pointSlug: m.pointSlug,
          valueCm: m.valueCm,
          notes: m.notes ?? entry.notes,
        }));
        const measurementResult = await addMeasurementEntries(clientId, built);
        if (!measurementResult) {
          return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }
        results.measurements = built.length;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Measurement validation failed';
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }

    return NextResponse.json(
      {
        success: true,
        clientId,
        data: {
          date: entry.date.toISOString().split('T')[0],
          ...results,
          ...(entry.notes ? { notes: entry.notes } : {}),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/clients/[clientId]/tracking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
