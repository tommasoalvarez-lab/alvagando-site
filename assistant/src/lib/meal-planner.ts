import { FOODS, MEAL_TEMPLATES, type MealSlot } from "./food-database";

export type PlannedItem = {
  name: string;
  grams: number;
};

export type PlannedMeal = {
  slot: MealSlot;
  label: string;
  items: PlannedItem[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DailyPlan = {
  meals: PlannedMeal[];
  totalKcal: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
};

const SLOT_LABELS: Record<MealSlot, string> = {
  colazione: "Colazione",
  pranzo: "Pranzo",
  cena: "Cena",
  spuntino: "Spuntino",
};

// Quote percentuali del target calorico giornaliero per numero di pasti.
const SLOT_SHARES: Record<number, { slot: MealSlot; share: number }[]> = {
  3: [
    { slot: "colazione", share: 0.3 },
    { slot: "pranzo", share: 0.4 },
    { slot: "cena", share: 0.3 },
  ],
  4: [
    { slot: "colazione", share: 0.25 },
    { slot: "pranzo", share: 0.35 },
    { slot: "spuntino", share: 0.1 },
    { slot: "cena", share: 0.3 },
  ],
  5: [
    { slot: "colazione", share: 0.22 },
    { slot: "spuntino", share: 0.08 },
    { slot: "pranzo", share: 0.32 },
    { slot: "spuntino", share: 0.08 },
    { slot: "cena", share: 0.3 },
  ],
};

function pickTemplate(slot: MealSlot, dietType: "onnivora" | "vegetariana", seed: number) {
  const candidates = MEAL_TEMPLATES.filter(
    (t) => t.slot === slot && (dietType === "onnivora" || t.vegetarian)
  );
  const pool = candidates.length > 0 ? candidates : MEAL_TEMPLATES.filter((t) => t.slot === slot);
  return pool[seed % pool.length];
}

export function generateDailyPlan(
  dailyCalorieTarget: number,
  mealsPerDay: number,
  dietType: "onnivora" | "vegetariana",
  randomSeed = Math.floor(Math.random() * 1000)
): DailyPlan {
  const shares = SLOT_SHARES[mealsPerDay] ?? SLOT_SHARES[4];

  const meals: PlannedMeal[] = shares.map((s, index) => {
    const template = pickTemplate(s.slot, dietType, randomSeed + index * 7);
    const targetKcal = dailyCalorieTarget * s.share;
    const scale = Math.min(1.6, Math.max(0.5, targetKcal / template.baselineKcal));

    let kcal = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;
    const items: PlannedItem[] = template.items.map((it) => {
      const food = FOODS[it.foodId];
      const grams = Math.round((it.grams * scale) / 5) * 5;
      kcal += (food.kcal100 * grams) / 100;
      protein += (food.protein100 * grams) / 100;
      carbs += (food.carbs100 * grams) / 100;
      fat += (food.fat100 * grams) / 100;
      return { name: food.name, grams };
    });

    return {
      slot: s.slot,
      label: SLOT_LABELS[s.slot],
      items,
      kcal: Math.round(kcal),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fat: Math.round(fat),
    };
  });

  return {
    meals,
    totalKcal: meals.reduce((sum, m) => sum + m.kcal, 0),
    totalProtein: meals.reduce((sum, m) => sum + m.protein, 0),
    totalCarbs: meals.reduce((sum, m) => sum + m.carbs, 0),
    totalFat: meals.reduce((sum, m) => sum + m.fat, 0),
  };
}
