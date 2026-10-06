// Swapping one food for another by equivalence. In the exchange table
// (`domain/data/foods.ts`) a food's `grams` is the cooked weight of ONE
// equivalent portion — 200 g de arroz ≡ 275 g de papa — so converting between
// foods of the same table is just the ratio of their portions. Works the same
// for carbohydrates (arroz ↔ papa) and proteins (pollo ↔ tilapia).

export interface FoodPortion {
  name: string;
  grams: number;
}

export interface Equivalent {
  foodName: string;
  grams: number;
}

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase("es");
}

// Case/whitespace-insensitive lookup. Throws on an unknown food: silently
// skipping it would under-count what the client ate.
export function findFood<T extends FoodPortion>(foods: T[], name: string): T {
  const target = normalizeName(name);
  const food = foods.find((candidate) => normalizeName(candidate.name) === target);
  if (!food) throw new Error(`Food without equivalence: ${name}`);
  return food;
}

// `grams` of `from` expressed as grams of `to` (unrounded).
export function convertEquivalent(grams: number, from: FoodPortion, to: FoodPortion): number {
  if (from.grams <= 0 || to.grams <= 0) {
    throw new Error(`Invalid equivalence portion: ${from.name} → ${to.name}`);
  }
  return (grams * to.grams) / from.grams;
}

// Kitchen-scale friendly amounts: nearest multiple of `step` grams.
export function roundToStep(grams: number, step = 5): number {
  return Math.round(grams / step) * step;
}

// "Te quedan 150 g de arroz ≈ 205 g de papa ≈ 160 g de pasta": `grams` of
// `from` converted to each option, rounded to `step`.
export function listEquivalents(
  grams: number,
  from: FoodPortion,
  options: FoodPortion[],
  step = 5,
): Equivalent[] {
  return options.map((option) => ({
    foodName: option.name,
    grams: roundToStep(convertEquivalent(grams, from, option), step),
  }));
}
