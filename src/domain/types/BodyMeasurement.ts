import { z } from "zod";

export const BodyMeasurementSchema = z.object({
  date: z.coerce.date(),
  pointSlug: z.string().min(1),
  valueCm: z.number().positive().max(300),
  notes: z.string().max(500).optional(),
}).refine((m) => m.date.getTime() <= Date.now(), {
  message: "Date cannot be in the future",
  path: ["date"],
});

export type BodyMeasurement = z.infer<typeof BodyMeasurementSchema>;
