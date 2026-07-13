import { z } from "zod";

export const DailyStepSchema = z.object({
  date: z.date(),
  steps: z.number().int().min(0, { message: "Steps must be 0 or greater" }).max(100000, { message: "Steps cannot exceed 100,000" }),
  notes: z.string().optional(),
}).refine((data) => data.date <= new Date(), {
  message: "Date cannot be in the future",
  path: ["date"]
});

export type DailyStep = z.infer<typeof DailyStepSchema>;
