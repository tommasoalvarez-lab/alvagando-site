"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PushRegister from "@/components/PushRegister";

export default function ImpostazioniPage() {
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [calorieTarget, setCalorieTarget] = useState(2000);
  const [dietType, setDietType] = useState<"onnivora" | "vegetariana">("onnivora");
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("full_name, daily_calorie_target, diet_type, meals_per_day")
        .eq("id", user.id)
        .single();

      if (data) {
        setFullName(data.full_name ?? "");
        setCalorieTarget(data.daily_calorie_target);
        setDietType(data.diet_type);
        setMealsPerDay(data.meals_per_day);
      }
      setLoading(false);
    })();
  }, [supabase]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      daily_calorie_target: calorieTarget,
      diet_type: dietType,
      meals_per_day: mealsPerDay,
    });

    // Il piano del giorno resta legato ai vecchi valori finché non lo rigeneri
    // manualmente dalla pagina "Pasti".
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <p className="text-sm text-gray-400">Caricamento…</p>;

  return (
    <div className="space-y-5">
      <div className="card">
        <p className="text-xs text-gray-500">Account</p>
        <p className="text-sm font-medium text-gray-900">{email}</p>
      </div>

      <form onSubmit={save} className="card space-y-4">
        <p className="text-sm font-semibold text-gray-900">Piano alimentare</p>
        <div>
          <label className="label">Nome</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="label">Target calorico giornaliero</label>
          <input
            type="number"
            min={1200}
            max={4000}
            step={50}
            className="input"
            value={calorieTarget}
            onChange={(e) => setCalorieTarget(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Tipo di dieta</label>
          <select
            className="input"
            value={dietType}
            onChange={(e) => setDietType(e.target.value as "onnivora" | "vegetariana")}
          >
            <option value="onnivora">Onnivora bilanciata</option>
            <option value="vegetariana">Vegetariana</option>
          </select>
        </div>
        <div>
          <label className="label">Pasti al giorno</label>
          <select
            className="input"
            value={mealsPerDay}
            onChange={(e) => setMealsPerDay(Number(e.target.value))}
          >
            <option value={3}>3 (colazione, pranzo, cena)</option>
            <option value={4}>4 (+ uno spuntino)</option>
            <option value={5}>5 (+ due spuntini)</option>
          </select>
        </div>
        <button type="submit" className="btn-primary w-full">
          Salva
        </button>
        {saved && <p className="text-center text-sm text-brand-700">Impostazioni salvate.</p>}
      </form>

      <div className="card space-y-2">
        <p className="text-sm font-semibold text-gray-900">Notifiche</p>
        <PushRegister />
      </div>
    </div>
  );
}
