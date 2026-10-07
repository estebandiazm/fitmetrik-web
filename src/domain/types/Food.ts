export type FoodCategory = 'FRUIT' | 'BASE' | 'COMPLEMENT';

export interface Food {
    name: string;
    // Weight of ONE equivalent portion: cooked for carbohydrates, raw for
    // proteins. Foods are only interchangeable within the same `category`.
    grams: number;
    category: FoodCategory;
    totalGrams?: number;
}
