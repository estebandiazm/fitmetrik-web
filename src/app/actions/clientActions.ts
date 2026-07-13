'use server';

import dbConnect from '../../lib/db/mongodb';
import { ClientModel, ClientDocument } from '../../lib/models/Client';
import { Client } from '../../domain/types/Client';
import { DietPlan } from '../../domain/types/DietPlan';
import { DailyStep, DailyStepSchema } from '../../domain/types/DailySteps';
import { DailyWeight, DailyWeightSchema } from '../../domain/types/DailyWeight';
import { MeasurementPoint, MeasurementPointSchema } from '../../domain/types/MeasurementPoint';
import { BodyMeasurement, BodyMeasurementSchema } from '../../domain/types/BodyMeasurement';
import { validateMeasurement, MEASUREMENT_POINTS_CATALOG } from '../../domain/services/bodyMeasurements';
import { calculateWeeklyAverage } from '../../domain/services/weightAverageService';
import { generateApiKey } from '../../lib/utils/crypto';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Deep-serialise a Mongoose document into a plain JS object safe for
 * the Next.js Server → Client Component boundary.
 * JSON round-trip converts ObjectIds → strings, Dates → ISO strings,
 * and strips any toJSON / prototype references.
 */
function toClient(doc: ClientDocument): Client & { id: string; updatedAt: Date } {
  const plain = JSON.parse(JSON.stringify(doc.toObject()));
  return {
    id: String(plain._id),
    name: plain.name,
    targetWeight: plain.targetWeight,
    coachId: String(plain.coachId),
    authId: plain.authId,
    plans: (plain.plans ?? []).map(sanitisePlan),
    dailySteps: plain.dailySteps ?? [],
    dailyWeights: plain.dailyWeights ?? [],
    stepGoal: plain.stepGoal,
    updatedAt: new Date(plain.updatedAt),
    measurementPoints: plain.measurementPoints ?? [],
    measurements: plain.measurements ?? [],
  };
}

/** Strip Mongo internals from an embedded plan object. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitisePlan(plan: any): DietPlan {
  const { _id, __v, updatedAt, ...rest } = plan;
  return rest as DietPlan;
}

// ─── Client CRUD ────────────────────────────────────────────────────────────

export async function createClient(
  data: Pick<Client, 'name' | 'coachId'> & Partial<Pick<Client, 'targetWeight' | 'authId'>>
): Promise<Client & { id: string }> {
  await dbConnect();
  const doc = await ClientModel.create({
    name: data.name,
    targetWeight: data.targetWeight,
    coachId: data.coachId,
    authId: data.authId,
    plans: [],
    dailySteps: [],
    apiKey: generateApiKey(),
  });
  return toClient(doc);
}

export async function getClients(): Promise<(Client & { id: string; updatedAt: Date })[]> {
  await dbConnect();
  const docs = await ClientModel.find()
    .select('-measurements -measurementPoints')
    .sort({ updatedAt: -1 });
  return docs.map((doc: ClientDocument) => toClient(doc));
}

export async function getClientById(
  id: string
): Promise<(Client & { id: string }) | null> {
  await dbConnect();
  const doc = await ClientModel.findById(id);
  if (!doc) return null;
  return toClient(doc);
}

export async function getClientByAuthId(
  authId: string
): Promise<(Client & { id: string }) | null> {
  await dbConnect();
  const doc = await ClientModel.findOne({ authId });
  if (!doc) return null;
  return toClient(doc);
}

export async function getClientsByCoachId(
  coachId: string
): Promise<(Client & { id: string; updatedAt: Date })[]> {
  await dbConnect();
  const docs = await ClientModel.find({ coachId })
    .select('-measurements -measurementPoints')
    .sort({ updatedAt: -1 });
  return docs.map((doc: ClientDocument) => toClient(doc));
}

export async function updateClient(
  id: string,
  data: Partial<Pick<Client, 'name' | 'targetWeight'>>
): Promise<(Client & { id: string }) | null> {
  await dbConnect();
  const doc = await ClientModel.findByIdAndUpdate(id, data, { new: true });
  if (!doc) return null;
  return toClient(doc);
}

// ─── Diet Plan ──────────────────────────────────────────────────────────────

export async function addDietPlanToClient(
  clientId: string,
  plan: DietPlan
): Promise<(Client & { id: string }) | null> {
  await dbConnect();
  const doc = await ClientModel.findByIdAndUpdate(
    clientId,
    { $push: { plans: plan } },
    { new: true }
  );
  if (!doc) return null;
  return toClient(doc);
}

// ─── Daily Steps ────────────────────────────────────────────────────────────

export async function addDailyStep(
  clientId: string,
  date: Date,
  steps: number,
  notes?: string
): Promise<(Client & { id: string }) | null> {
  await dbConnect();

  const parsed = DailyStepSchema.safeParse({ date, steps, notes });
  if (!parsed.success) {
    throw new Error(`Validation error: ${parsed.error.message}`);
  }

  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  const doc = await ClientModel.findById(clientId);
  if (!doc) return null;

  const existingIndex = doc.dailySteps.findIndex(
    (step: any) => new Date(step.date).toDateString() === normalizedDate.toDateString()
  );

  if (existingIndex >= 0) {
    doc.dailySteps[existingIndex] = { date: normalizedDate, steps, notes };
  } else {
    doc.dailySteps.push({ date: normalizedDate, steps, notes });
  }

  await doc.save();
  return toClient(doc);
}

export async function getDailyStepsRange(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<DailyStep[]> {
  await dbConnect();
  const doc = await ClientModel.findById(clientId);
  if (!doc) return [];

  const filtered = doc.dailySteps.filter((step: any) => {
    const stepDate = new Date(step.date);
    return stepDate >= startDate && stepDate <= endDate;
  });

  return filtered.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getDailyStepsAverage(
  clientId: string,
  days: number = 30
): Promise<{ average: number; count: number }> {
  await dbConnect();
  const doc = await ClientModel.findById(clientId);
  if (!doc || doc.dailySteps.length === 0) return { average: 0, count: 0 };

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const filtered = doc.dailySteps.filter((step: any) => {
    return new Date(step.date) >= cutoffDate;
  });

  if (filtered.length === 0) return { average: 0, count: 0 };

  const total = filtered.reduce((sum: number, step: any) => sum + step.steps, 0);
  const average = Math.round(total / filtered.length);

  return { average, count: filtered.length };
}

export async function setStepGoal(
  clientId: string,
  goal: number
): Promise<(Client & { id: string }) | null> {
  await dbConnect();

  if (!Number.isInteger(goal) || goal <= 0) {
    throw new Error('Step goal must be a positive integer');
  }

  const doc = await ClientModel.findByIdAndUpdate(
    clientId,
    { stepGoal: goal },
    { new: true }
  );
  if (!doc) return null;
  return toClient(doc);
}

export async function getStepGoal(
  clientId: string
): Promise<number | null> {
  await dbConnect();
  const doc = await ClientModel.findById(clientId);
  if (!doc) return null;
  return doc.stepGoal ?? null;
}

// ─── Daily Weights ───────────────────────────────────────────────────────────

export async function addDailyWeight(
  clientId: string,
  date: Date,
  weight: number,
  notes?: string
): Promise<(Client & { id: string }) | null> {
  await dbConnect();

  const parsed = DailyWeightSchema.safeParse({ date, weight, notes });
  if (!parsed.success) {
    throw new Error(`Validation error: ${parsed.error.message}`);
  }

  let finalNotes = notes;
  if (weight === 0) {
    const autoNote = 'Peso no registrado, tomado del dia anterior';
    finalNotes = notes ? `${notes}. ${autoNote}` : autoNote;
  }

  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);

  const doc = await ClientModel.findById(clientId);
  if (!doc) return null;

  const existingIndex = (doc.dailyWeights ?? []).findIndex(
    (entry: DailyWeight) =>
      new Date(entry.date).toDateString() === normalizedDate.toDateString()
  );

  if (existingIndex >= 0) {
    doc.dailyWeights[existingIndex] = { date: normalizedDate, weight, notes: finalNotes };
  } else {
    if (!doc.dailyWeights) doc.dailyWeights = [];
    doc.dailyWeights.push({ date: normalizedDate, weight, notes: finalNotes });
  }

  await doc.save();
  return toClient(doc);
}

export async function getDailyWeights(
  clientId: string
): Promise<DailyWeight[]> {
  await dbConnect();
  const doc = await ClientModel.findById(clientId);
  if (!doc) return [];
  return doc.dailyWeights ?? [];
}

export async function getWeeklyWeightAverage(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<number | null> {
  const weights = await getDailyWeights(clientId);
  return calculateWeeklyAverage(weights, startDate, endDate);
}

export async function setTargetWeight(
  clientId: string,
  targetWeight: number
): Promise<(Client & { id: string }) | null> {
  await dbConnect();

  if (typeof targetWeight !== 'number' || targetWeight <= 0) {
    throw new Error('Target weight must be a positive number');
  }

  const doc = await ClientModel.findByIdAndUpdate(
    clientId,
    { targetWeight },
    { new: true }
  );
  if (!doc) return null;
  return toClient(doc);
}

// ─── Body Measurements ───────────────────────────────────────────────────────

const CATALOG_SLUGS = new Set(MEASUREMENT_POINTS_CATALOG.map((p) => p.slug));

export async function setMeasurementPoints(
  clientId: string,
  points: MeasurementPoint[]
): Promise<(Client & { id: string }) | null> {
  await dbConnect();

  for (const point of points) {
    const parsed = MeasurementPointSchema.safeParse(point);
    if (!parsed.success) {
      throw new Error(`Validation error for point "${point.slug}": ${parsed.error.message}`);
    }
    if (!CATALOG_SLUGS.has(point.slug)) {
      throw new Error(`Unknown slug: "${point.slug}"`);
    }
  }

  const doc = await ClientModel.findByIdAndUpdate(
    clientId,
    { measurementPoints: points },
    { new: true }
  );
  if (!doc) return null;
  return toClient(doc);
}

export async function addMeasurementEntries(
  clientId: string,
  entries: Array<{ date: Date; pointSlug: string; valueCm: number; notes?: string }>
): Promise<(Client & { id: string }) | null> {
  await dbConnect();

  const doc = await ClientModel.findById(clientId);
  if (!doc) return null;

  for (const entry of entries) {
    const parsed = BodyMeasurementSchema.safeParse(entry);
    if (!parsed.success) {
      throw new Error(`Validation error: ${parsed.error.message}`);
    }

    const point = (doc.measurementPoints ?? []).find(
      (p: MeasurementPoint) => p.slug === entry.pointSlug
    );
    if (!point) {
      throw new Error(`Point "${entry.pointSlug}" is not configured for this client`);
    }
    if (!point.active) {
      throw new Error(`Point "${entry.pointSlug}" is not active`);
    }

    const validation = validateMeasurement(point, entry.valueCm);
    if (!validation.ok) {
      throw new Error(validation.reason);
    }

    const normalizedDate = new Date(entry.date);
    normalizedDate.setHours(0, 0, 0, 0);

    const existingIndex = (doc.measurements ?? []).findIndex(
      (m: BodyMeasurement) =>
        m.pointSlug === entry.pointSlug &&
        new Date(m.date).toDateString() === normalizedDate.toDateString()
    );

    const newEntry = {
      date: normalizedDate,
      pointSlug: entry.pointSlug,
      valueCm: entry.valueCm,
      notes: entry.notes,
    };

    if (existingIndex >= 0) {
      doc.measurements[existingIndex] = newEntry;
    } else {
      if (!doc.measurements) doc.measurements = [];
      doc.measurements.push(newEntry);
    }
  }

  await doc.save();
  return toClient(doc);
}

export async function getMeasurementsByPoint(
  clientId: string,
  pointSlug: string
): Promise<BodyMeasurement[]> {
  await dbConnect();

  const doc = await ClientModel.findById(clientId);
  if (!doc) return [];

  return (doc.measurements ?? [])
    .filter((m: BodyMeasurement) => m.pointSlug === pointSlug)
    .sort(
      (a: BodyMeasurement, b: BodyMeasurement) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}
