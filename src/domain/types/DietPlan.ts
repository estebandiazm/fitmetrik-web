import { z } from "zod";
import { CarbPoolSchema } from "./CarbPool";

export const FoodOptionSchema = z.object({
  foodName: z.string(),
  grams: z.number(),
  measureUnit: z.string().default("g"),
  notes: z.string().optional(),
});
export type FoodOption = z.infer<typeof FoodOptionSchema>;

export const BlockTypeSchema = z.enum(["BASE", "ACOMPAÑAMIENTO", "GRASA", "FRUTA"]);
export type BlockType = z.infer<typeof BlockTypeSchema>;

export const MealBlockSchema = z.object({
  blockType: BlockTypeSchema,
  options: z.array(FoodOptionSchema),
});
export type MealBlock = z.infer<typeof MealBlockSchema>;

export const MealSchema = z.object({
  mealName: z.string(),
  blocks: z.array(MealBlockSchema),
});
export type Meal = z.infer<typeof MealSchema>;

export const SnackOptionSchema = z.object({
  optionNumber: z.number().int(),
  description: z.string(),
});
export type SnackOption = z.infer<typeof SnackOptionSchema>;

export const DietPlanSchema = z.object({
  label: z.string().optional(),
  days: z.string().optional(),
  recommendations: z.string().optional(),
  meals: z.array(MealSchema),
  snacks: z.array(SnackOptionSchema).optional(),
  carbPool: CarbPoolSchema.optional(),
});

export type DietPlan = z.infer<typeof DietPlanSchema>;
