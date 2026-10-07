import { z } from "zod";

// A carbohydrate budget shared by several meals of a plan ("bolsa de
// carbohidratos"): the coach sets e.g. 300 g of cooked rice for Comida 2 and
// Comida 3, and the client splits it however they like, swapping foods by
// equivalence. Amounts are always COOKED weight of `referenceFood`.
export const CarbPoolSchema = z.object({
  referenceFood: z.string().min(1),
  totalGrams: z.number().positive(),
  mealNames: z.array(z.string().min(1)).min(2, { message: "A pool must be shared by at least 2 meals" }),
  // ± band around `totalGrams` within which the day counts as fulfilled.
  tolerancePct: z.number().min(0).max(100).default(10),
});
export type CarbPool = z.infer<typeof CarbPoolSchema>;

// What the client reports eating from the pool in one meal.
export const PoolPortionSchema = z.object({
  mealName: z.string().min(1),
  foodName: z.string().min(1),
  grams: z.number().min(0),
});
export type PoolPortion = z.infer<typeof PoolPortionSchema>;
