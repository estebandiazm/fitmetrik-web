import { DietPlan, FoodOption, Meal } from "../types/DietPlan";
import { Food } from "../types/Food";

export class DietEngine {
  /**
   * Translates the basic mathematical proportion calculation
   * from the legacy system into the new strict DictPlan schema.
   */
  private static calculateGrams(item: Food, targetGrams: number, pivotGrams: number): number {
    const index = (targetGrams * 90) / pivotGrams;
    const finalGrams = (item.grams * index) / 90;
    return Math.round(finalGrams);
  }

  /**
   * Takes a base array of foods and a target amount of the "pivot" (the first food item)
   * and calculates the proportional grams for all items.
   */
  public static calculateBlockOptions(targetGrams: number, foods: Food[]): FoodOption[] {
    if (!foods || foods.length === 0) return [];

    const pivotGrams = foods[0].grams;
    
    return foods.map((food) => {
      return {
        foodName: food.name,
        grams: this.calculateGrams(food, targetGrams, pivotGrams),
        measureUnit: "g"
      };
    });
  }

  /**
   * Helper to generate a minimal DietPlan. In a real scenario, this would
   * take more complex inputs (targets per meal) and assemble the whole object.
   */
  public static generatePlan(
    clientName: string,
    fruits: Food[], fruitTarget: number,
    firstMeal: Food[], firstMealTarget: number,
    secondMealBase: Food[], secondMealBaseTarget: number,
    secondMealComplement: Food[], secondMealComplementTarget: number,
    thirdMealBase: Food[], thirdMealBaseTarget: number,
    thirdMealComplement: Food[], thirdMealComplementTarget: number
  ): DietPlan {
    
    const fruitOptions = this.calculateBlockOptions(fruitTarget, fruits);
    const firstMealOptions = this.calculateBlockOptions(firstMealTarget, firstMeal);
    
    // Meal 2
    const m2BaseOptions = this.calculateBlockOptions(secondMealBaseTarget, secondMealBase);
    const m2CompOptions = this.calculateBlockOptions(secondMealComplementTarget, secondMealComplement);

    // Meal 3
    const m3BaseOptions = this.calculateBlockOptions(thirdMealBaseTarget, thirdMealBase);
    const m3CompOptions = this.calculateBlockOptions(thirdMealComplementTarget, thirdMealComplement);

    const meals: Meal[] = [
      {
        mealName: "Frutas",
        blocks: [{ blockType: "FRUTA", options: fruitOptions }]
      },
      {
        mealName: "Comida 1",
        blocks: [{ blockType: "BASE", options: firstMealOptions }]
      },
      {
        mealName: "Comida 2",
        blocks: [
          { blockType: "BASE", options: m2BaseOptions },
          { blockType: "ACOMPAÑAMIENTO", options: m2CompOptions }
        ]
      },
      {
        mealName: "Comida 3",
        blocks: [
          { blockType: "BASE", options: m3BaseOptions },
          { blockType: "ACOMPAÑAMIENTO", options: m3CompOptions }
        ]
      }
    ];

    return {
      meals: meals,
      snacks: []
    };
  }
}
