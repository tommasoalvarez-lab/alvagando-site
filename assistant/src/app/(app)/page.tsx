"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { eur } from "@/lib/format";

type UpcomingEvent = { id: string; title: string; start_at: string };

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const [balance, setBalance] = useState<number | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingEvent[]>([]);
  const [mealKcal, setMealKcal] = useState<number | null>(null);
  const [calorieTarget, setCalorieTarget] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);

      const { data: txs } = await supabase
        .from("transactions")
        .select("type, amount")
        .gte("occurred_on", start);
      if (txs) {
        const total = txs.reduce((sum, t) => sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)), 0);
        setBalance(total);
      }

      const { data: events } = await supabase
        .from("events")
        .select("id, title, start_at")
        .gte("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(3);
      setUpcoming(events ?? []);

      const today = new Date().toISOString().slice(0, 10);
      const { data: plan } = await supabase
        .from("meal_plans")
        .select("total_calories")
        .eq("plan_date", today)
        .single();
      if (plan) setMealKcal(plan.total_calories);

      const { data: profile } = await supabase
        .from("profiles")
        .select("daily_calorie_target")
        .eq("id", user.id)
        .single();
      if (profile) setCalorieTarget(profile.daily_calorie_target);
    })();
  }, [supabase]);

  return (
    <div className="space-y-4">
      <Link href="/finanze" className="card block">
        <p className="text-xs text-gray-500">Bilancio di questo mese</p>
        <p className={`mt-1 text-xl font-semibold ${balance !== null && balance < 0 ? "text-red-600" : "text-gray-900"}`}>
          {balance !== null ? eur.format(balance) : "…"}
        </p>
      </Link>

      <Link href="/piano-alimentare" className="card block">
        <p className="text-xs text-gray-500">Piano alimentare di oggi</p>
        <p className="mt-1 text-xl font-semibold text-gray-900">
          {mealKcal !== null ? `${mealKcal} kcal` : "Non ancora generato"}
          {calorieTarget !== null && mealKcal !== null && (
            <span className="ml-1 text-sm font-normal text-gray-400">/ {calorieTarget}</span>
          )}
        </p>
      </Link>

      <Link href="/agenda" className="card block">
        <p className="mb-2 text-xs text-gray-500">Prossimi impegni</p>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-400">Nessun impegno in programma.</p>
        ) : (
          <ul className="space-y-1.5">
            {upcoming.map((ev) => (
              <li key={ev.id} className="flex justify-between text-sm">
                <span className="text-gray-900">{ev.title}</span>
                <span className="text-gray-400">
                  {new Date(ev.start_at).toLocaleString("it-IT", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Link>
    </div>
  );
}
