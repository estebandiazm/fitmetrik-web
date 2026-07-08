import { z } from "zod";

export const BodyCoordsSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

export const MeasurementPointSchema = z.object({
  slug: z.string().regex(/^[a-z][a-z0-9-]*$/),
  label: z.string().min(1).max(60),
  bodyCoords: BodyCoordsSchema,
  active: z.boolean(),
  minCm: z.number().positive(),
  maxCm: z.number().positive(),
}).refine((p) => p.maxCm > p.minCm, {
  message: "maxCm must be greater than minCm",
  path: ["maxCm"],
});

export type BodyCoords = z.infer<typeof BodyCoordsSchema>;
export type MeasurementPoint = z.infer<typeof MeasurementPointSchema>;
