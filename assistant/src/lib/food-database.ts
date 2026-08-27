// Valori nutrizionali medi per 100g (fonte: tabelle nutrizionali generiche).
export type Food = {
  id: string;
  name: string;
  kcal100: number;
  protein100: number;
  carbs100: number;
  fat100: number;
};

export const FOODS: Record<string, Food> = {
  fiocchi_avena: { id: "fiocchi_avena", name: "Fiocchi d'avena", kcal100: 379, protein100: 13, carbs100: 62, fat100: 7 },
  latte_parzialmente_scremato: { id: "latte_parzialmente_scremato", name: "Latte parzialmente scremato", kcal100: 46, protein100: 3.3, carbs100: 4.9, fat100: 1.6 },
  yogurt_greco: { id: "yogurt_greco", name: "Yogurt greco", kcal100: 97, protein100: 9, carbs100: 4, fat100: 5 },
  banana: { id: "banana", name: "Banana", kcal100: 89, protein100: 1.1, carbs100: 23, fat100: 0.3 },
  mirtilli: { id: "mirtilli", name: "Mirtilli", kcal100: 57, protein100: 0.7, carbs100: 14, fat100: 0.3 },
  uova: { id: "uova", name: "Uova", kcal100: 143, protein100: 12.6, carbs100: 0.7, fat100: 9.5 },
  pane_integrale: { id: "pane_integrale", name: "Pane integrale", kcal100: 247, protein100: 9, carbs100: 41, fat100: 3.4 },
  avocado: { id: "avocado", name: "Avocado", kcal100: 160, protein100: 2, carbs100: 8.5, fat100: 14.7 },
  miele: { id: "miele", name: "Miele", kcal100: 304, protein100: 0.3, carbs100: 82, fat100: 0 },
  mandorle: { id: "mandorle", name: "Mandorle", kcal100: 579, protein100: 21, carbs100: 22, fat100: 50 },

  petto_pollo: { id: "petto_pollo", name: "Petto di pollo alla griglia", kcal100: 165, protein100: 31, carbs100: 0, fat100: 3.6 },
  salmone: { id: "salmone", name: "Salmone al forno", kcal100: 208, protein100: 20, carbs100: 0, fat100: 13 },
  tonno_naturale: { id: "tonno_naturale", name: "Tonno al naturale", kcal100: 116, protein100: 26, carbs100: 0, fat100: 1 },
  ceci: { id: "ceci", name: "Ceci cotti", kcal100: 164, protein100: 8.9, carbs100: 27, fat100: 2.6 },
  lenticchie: { id: "lenticchie", name: "Lenticchie cotte", kcal100: 116, protein100: 9, carbs100: 20, fat100: 0.4 },
  tofu: { id: "tofu", name: "Tofu", kcal100: 76, protein100: 8, carbs100: 1.9, fat100: 4.8 },
  riso_basmati: { id: "riso_basmati", name: "Riso basmati cotto", kcal100: 121, protein100: 2.7, carbs100: 25, fat100: 0.4 },
  pasta_integrale: { id: "pasta_integrale", name: "Pasta integrale cotta", kcal100: 124, protein100: 5, carbs100: 25, fat100: 0.9 },
  quinoa: { id: "quinoa", name: "Quinoa cotta", kcal100: 120, protein100: 4.4, carbs100: 21, fat100: 1.9 },
  patate: { id: "patate", name: "Patate al forno", kcal100: 93, protein100: 2, carbs100: 21, fat100: 0.1 },

  verdure_miste: { id: "verdure_miste", name: "Verdure miste saltate", kcal100: 45, protein100: 2, carbs100: 7, fat100: 1.2 },
  insalata_mista: { id: "insalata_mista", name: "Insalata mista", kcal100: 20, protein100: 1.4, carbs100: 3, fat100: 0.3 },
  broccoli: { id: "broccoli", name: "Broccoli al vapore", kcal100: 35, protein100: 2.8, carbs100: 7, fat100: 0.4 },
  pomodori: { id: "pomodori", name: "Pomodori", kcal100: 18, protein100: 0.9, carbs100: 3.9, fat100: 0.2 },
  olio_oliva: { id: "olio_oliva", name: "Olio extravergine d'oliva", kcal100: 884, protein100: 0, carbs100: 0, fat100: 100 },

  parmigiano: { id: "parmigiano", name: "Parmigiano", kcal100: 392, protein100: 33, carbs100: 0, fat100: 29 },
  frutta_secca_mista: { id: "frutta_secca_mista", name: "Frutta secca mista", kcal100: 580, protein100: 18, carbs100: 20, fat100: 50 },
  mela: { id: "mela", name: "Mela", kcal100: 52, protein100: 0.3, carbs100: 14, fat100: 0.2 },
  hummus: { id: "hummus", name: "Hummus", kcal100: 166, protein100: 7.9, carbs100: 14, fat100: 9.6 },
  cracker_integrali: { id: "cracker_integrali", name: "Cracker integrali", kcal100: 420, protein100: 10, carbs100: 68, fat100: 12 },
};

export type MealSlot = "colazione" | "pranzo" | "cena" | "spuntino";

export type MealTemplate = {
  id: string;
  slot: MealSlot;
  vegetarian: boolean;
  baselineKcal: number;
  items: { foodId: string; grams: number }[];
};

// Ogni template è tarato per una dieta da ~2000 kcal/giorno; le quantità
// vengono poi riscalate in proporzione al target calorico dell'utente.
export const MEAL_TEMPLATES: MealTemplate[] = [
  // Colazione
  { id: "col_avena", slot: "colazione", vegetarian: true, baselineKcal: 430, items: [
    { foodId: "fiocchi_avena", grams: 60 }, { foodId: "latte_parzialmente_scremato", grams: 200 },
    { foodId: "banana", grams: 100 }, { foodId: "mirtilli", grams: 40 },
  ] },
  { id: "col_uova", slot: "colazione", vegetarian: true, baselineKcal: 420, items: [
    { foodId: "uova", grams: 120 }, { foodId: "pane_integrale", grams: 60 }, { foodId: "avocado", grams: 50 },
  ] },
  { id: "col_yogurt", slot: "colazione", vegetarian: true, baselineKcal: 400, items: [
    { foodId: "yogurt_greco", grams: 200 }, { foodId: "mandorle", grams: 20 },
    { foodId: "miele", grams: 15 }, { foodId: "mirtilli", grams: 60 },
  ] },

  // Pranzo
  { id: "pra_pollo_riso", slot: "pranzo", vegetarian: false, baselineKcal: 650, items: [
    { foodId: "petto_pollo", grams: 150 }, { foodId: "riso_basmati", grams: 180 },
    { foodId: "verdure_miste", grams: 150 }, { foodId: "olio_oliva", grams: 10 },
  ] },
  { id: "pra_tonno_pasta", slot: "pranzo", vegetarian: false, baselineKcal: 630, items: [
    { foodId: "pasta_integrale", grams: 180 }, { foodId: "tonno_naturale", grams: 120 },
    { foodId: "pomodori", grams: 100 }, { foodId: "olio_oliva", grams: 10 },
  ] },
  { id: "pra_ceci_quinoa", slot: "pranzo", vegetarian: true, baselineKcal: 610, items: [
    { foodId: "ceci", grams: 200 }, { foodId: "quinoa", grams: 120 },
    { foodId: "insalata_mista", grams: 100 }, { foodId: "olio_oliva", grams: 10 },
  ] },

  // Cena
  { id: "cen_salmone_patate", slot: "cena", vegetarian: false, baselineKcal: 560, items: [
    { foodId: "salmone", grams: 150 }, { foodId: "patate", grams: 200 }, { foodId: "broccoli", grams: 150 },
  ] },
  { id: "cen_tofu_verdure", slot: "cena", vegetarian: true, baselineKcal: 480, items: [
    { foodId: "tofu", grams: 180 }, { foodId: "riso_basmati", grams: 120 }, { foodId: "verdure_miste", grams: 180 },
  ] },
  { id: "cen_lenticchie", slot: "cena", vegetarian: true, baselineKcal: 500, items: [
    { foodId: "lenticchie", grams: 220 }, { foodId: "insalata_mista", grams: 120 }, { foodId: "olio_oliva", grams: 10 },
  ] },

  // Spuntino
  { id: "spu_frutta_secca", slot: "spuntino", vegetarian: true, baselineKcal: 180, items: [
    { foodId: "mela", grams: 150 }, { foodId: "frutta_secca_mista", grams: 20 },
  ] },
  { id: "spu_yogurt", slot: "spuntino", vegetarian: true, baselineKcal: 160, items: [
    { foodId: "yogurt_greco", grams: 150 }, { foodId: "miele", grams: 10 },
  ] },
  { id: "spu_hummus", slot: "spuntino", vegetarian: true, baselineKcal: 200, items: [
    { foodId: "hummus", grams: 60 }, { foodId: "cracker_integrali", grams: 30 },
  ] },
];
