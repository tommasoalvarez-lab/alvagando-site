"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { generateDailyPlan, type DailyPlan, type PlannedMeal } from "@/lib/meal-planner";

type Profile = {
  daily_calorie_target: number;
  diet_type: "onnivora" | "vegetariana";
  meals_per_day: number;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function PianoAlimentarePage() {
  const supabase = useMemo(() => createClient(), []);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("daily_calorie_target, diet_type, meals_per_day")
      .eq("id", user.id)
      .single();

    const prof: Profile = profileData ?? {
      daily_calorie_target: 2000,
      diet_type: "onnivora",
      meals_per_day: 4,
    };
    setProfile(prof);

    const { data: existingPlan } = await supabase
      .from("meal_plans")
      .select("meals, total_calories, total_protein_g, total_carbs_g, total_fat_g")
      .eq("plan_date", todayIso())
      .single();

    if (existingPlan) {
      setPlan({
        meals: existingPlan.meals as PlannedMeal[],
        totalKcal: existingPlan.total_calories,
        totalProtein: existingPlan.total_protein_g,
        totalCarbs: existingPlan.total_carbs_g,
        totalFat: existingPlan.total_fat_g,
      });
    } else {
      const generated = generateDailyPlan(prof.daily_calorie_target, prof.meals_per_day, prof.diet_type);
      setPlan(generated);
      await savePlan(user.id, generated);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function savePlan(userId: string, dailyPlan: DailyPlan) {
    await supabase.from("meal_plans").upsert(
      {
        user_id: userId,
        plan_date: todayIso(),
        meals: dailyPlan.meals,
        total_calories: dailyPlan.totalKcal,
        total_protein_g: dailyPlan.totalProtein,
        total_carbs_g: dailyPlan.totalCarbs,
        total_fat_g: dailyPlan.totalFat,
      },
      { onConflict: "user_id,plan_date" }
    );
  }

  async function regenerate() {
    if (!profile) return;
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    const generated = generateDailyPlan(
      profile.daily_calorie_target,
      profile.meals_per_day,
      profile.diet_type
    );
    setPlan(generated);
    await savePlan(user.id, generated);
    setSaving(false);
  }

  if (loading) return <p className="text-sm text-gray-400">Preparazione del piano…</p>;
  if (!plan || !profile) return null;

  const target = profile.daily_calorie_target;
  const diff = plan.totalKcal - target;

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Oggi</p>
            <p className="text-base font-semibold text-gray-900">{plan.totalKcal} kcal</p>
            <p className="text-xs text-gray-400">
              Obiettivo {target} kcal ({diff >= 0 ? "+" : ""}
              {diff})
            </p>
          </div>
          <button onClick={regenerate} disabled={saving} className="btn-secondary text-xs">
            {saving ? "…" : "🔄 Rigenera giornata"}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-gray-50 py-2">
            <p className="font-semibold text-gray-900">{plan.totalProtein} g</p>
            <p className="text-gray-400">Proteine</p>
          </div>
          <div className="rounded-lg bg-gray-50 py-2">
            <p className="font-semibold text-gray-900">{plan.totalCarbs} g</p>
            <p className="text-gray-400">Carboidrati</p>
          </div>
          <div className="rounded-lg bg-gray-50 py-2">
            <p className="font-semibold text-gray-900">{plan.totalFat} g</p>
            <p className="text-gray-400">Grassi</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {plan.meals.map((meal, index) => (
          <div key={`${meal.slot}-${index}`} className="card">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">{meal.label}</p>
              <p className="text-xs text-gray-400">{meal.kcal} kcal</p>
            </div>
            <ul className="space-y-1">
              {meal.items.map((item, i) => (
                <li key={i} className="flex justify-between text-sm text-gray-600">
                  <span>{item.name}</span>
                  <span className="text-gray-400">{item.grams} g</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400">
        Cambia obiettivo calorico o tipo di dieta in Profilo → Impostazioni.
      </p>
    </div>
  );
}
