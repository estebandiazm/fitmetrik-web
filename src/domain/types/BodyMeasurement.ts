import { z } from "zod";

export const BodyMeasurementSchema = z.object({
  date: z.coerce.date(),
  pointSlug: z.string().min(1),
  // REQ-BMT-02: finite, non-negative. No per-point range (REQ-BMT-07 removed).
  // z.number() already rejects NaN and ±Infinity, so .min(0) yields "finite, non-negative".
  valueCm: z.number().min(0),
  notes: z.string().max(500).optional(),
}).refine((m) => m.date.getTime() <= Date.now(), {
  message: "Date cannot be in the future",
  path: ["date"],
});

export type BodyMeasurement = z.infer<typeof BodyMeasurementSchema>;
