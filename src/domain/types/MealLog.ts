import { z } from "zod";

// What the client reports eating from a shared pool in one meal of one day.
// `date` is the client's LOCAL calendar day ("YYYY-MM-DD"), so "today" never
// shifts with the server's timezone. One entry per (date, mealName).
export const MealLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Date must be YYYY-MM-DD" }),
  mealName: z.string().min(1),
  foodName: z.string().min(1),
  // Amount in the option's own unit (grams, or units for "ud" options).
  grams: z.number().positive().max(5000),
});
export type MealLog = z.infer<typeof MealLogSchema>;
