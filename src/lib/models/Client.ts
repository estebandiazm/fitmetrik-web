import mongoose, { Schema, Document } from 'mongoose';
import { DietPlan } from '../../domain/types/DietPlan';
import { Client as IClient } from '../../domain/types/Client';
import { DailyWeight } from '../../domain/types/DailyWeight';
import { MeasurementPoint } from '../../domain/types/MeasurementPoint';
import { BodyMeasurement } from '../../domain/types/BodyMeasurement';

// --- Sub-Schemas based on domain/types ---

const FoodOptionSchema = new Schema({
  foodName: { type: String, required: true },
  grams: { type: Number, required: true },
  measureUnit: { type: String, default: 'g' },
  notes: { type: String }
}, { _id: false });

const MealBlockSchema = new Schema({
  blockType: { type: String, enum: ['BASE', 'ACOMPAÑAMIENTO', 'GRASA', 'FRUTA'], required: true },
  options: [FoodOptionSchema]
}, { _id: false });

const MealSchema = new Schema({
  mealName: { type: String, required: true },
  blocks: [MealBlockSchema]
}, { _id: false });

const SnackOptionSchema = new Schema({
  optionNumber: { type: Number, required: true },
  description: { type: String, required: true }
}, { _id: false });

const DietPlanSchema = new Schema({
  label: { type: String },
  days: { type: String },
  recommendations: { type: String },
  meals: [MealSchema],
  snacks: [SnackOptionSchema],
}, { timestamps: true });

const DailyStepsSchema = new Schema({
  date: { type: Date, required: true },
  steps: { type: Number, required: true, min: 0, max: 100000 },
  notes: { type: String }
}, { _id: false });

const DailyWeightSchema = new Schema({
  date: { type: Date, required: true },
  weight: { type: Number, required: true, min: 0.1, max: 500 },
  notes: { type: String }
}, { _id: false });

const MeasurementPointSubSchema = new Schema({
  slug: { type: String, required: true },
  label: { type: String, required: true },
  bodyCoords: {
    x: { type: Number, required: true, min: 0, max: 100 },
    y: { type: Number, required: true, min: 0, max: 100 },
  },
  active: { type: Boolean, required: true, default: false },
  minCm: { type: Number, required: true },
  maxCm: { type: Number, required: true },
}, { _id: false });

const BodyMeasurementSubSchema = new Schema({
  date: { type: Date, required: true },
  pointSlug: { type: String, required: true },
  valueCm: { type: Number, required: true, min: 0.1, max: 300 },
  notes: { type: String },
}, { _id: false });

// --- Main Client Schema ---

export interface ClientDocument extends Omit<IClient, 'plans' | 'coachId' | 'authId' | 'dailySteps' | 'dailyWeights' | 'measurementPoints' | 'measurements'>, Document {
  plans: DietPlan[];
  coachId: mongoose.Types.ObjectId;
  authId?: string;
  dailySteps: Array<{ date: Date; steps: number; notes?: string }>;
  dailyWeights: Array<DailyWeight>;
  stepGoal?: number;
  apiKey?: string;
  measurementPoints: Array<MeasurementPoint>;
  measurements: Array<BodyMeasurement>;
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<ClientDocument>({
  name: { type: String, required: true },
  targetWeight: { type: Number },
  coachId: { type: Schema.Types.ObjectId, ref: 'Coach', required: true },
  authId: { type: String, sparse: true, index: true },
  plans: [DietPlanSchema],
  dailySteps: [DailyStepsSchema],
  dailyWeights: [DailyWeightSchema],
  stepGoal: { type: Number },
  apiKey: { type: String, unique: true, sparse: true, index: true },
  measurementPoints: { type: [MeasurementPointSubSchema], default: [] },
  measurements: { type: [BodyMeasurementSubSchema], default: [] },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Avoid OverwriteModelError in Next.js HMR
export const ClientModel = mongoose.models.Client || mongoose.model<ClientDocument>('Client', ClientSchema);
