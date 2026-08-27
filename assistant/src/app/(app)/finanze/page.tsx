"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { eur, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/format";

type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string | null;
  occurred_on: string;
};

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

export default function FinanzePage() {
  const supabase = useMemo(() => createClient(), []);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [occurredOn, setOccurredOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const { start, end } = currentMonthRange();

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("id, type, amount, category, description, occurred_on")
      .gte("occurred_on", start)
      .lte("occurred_on", end)
      .order("occurred_on", { ascending: false });
    setTransactions(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => map.set(t.category, (map.get(t.category) ?? 0) + Number(t.amount)));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const maxCategory = byCategory[0]?.[1] ?? 0;

  async function addTransaction(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(amount.replace(",", "."));
    if (!value || value <= 0) return;

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    await supabase.from("transactions").insert({
      user_id: user.id,
      type,
      amount: value,
      category,
      description: description || null,
      occurred_on: occurredOn,
    });

    setAmount("");
    setDescription("");
    setSaving(false);
    load();
  }

  async function remove(id: string) {
    await supabase.from("transactions").delete().eq("id", id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        <div className="card">
          <p className="text-xs text-gray-500">Entrate</p>
          <p className="mt-1 text-base font-semibold text-brand-700">{eur.format(totals.income)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Uscite</p>
          <p className="mt-1 text-base font-semibold text-red-600">{eur.format(totals.expense)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">Bilancio</p>
          <p className={`mt-1 text-base font-semibold ${totals.balance >= 0 ? "text-gray-900" : "text-red-600"}`}>
            {eur.format(totals.balance)}
          </p>
        </div>
      </div>

      <form onSubmit={addTransaction} className="card space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setType("expense");
              setCategory(EXPENSE_CATEGORIES[0]);
            }}
            className={`flex-1 rounded-xl py-2 text-sm font-medium ${
              type === "expense" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            Uscita
          </button>
          <button
            type="button"
            onClick={() => {
              setType("income");
              setCategory(INCOME_CATEGORIES[0]);
            }}
            className={`flex-1 rounded-xl py-2 text-sm font-medium ${
              type === "income" ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            Entrata
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Importo (€)</label>
            <input
              className="input"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Data</label>
            <input
              type="date"
              className="input"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Categoria</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Nota (opzionale)</label>
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="es. cena con amici"
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "Salvataggio…" : "Aggiungi"}
        </button>
      </form>

      {byCategory.length > 0 && (
        <div className="card">
          <p className="mb-3 text-sm font-medium text-gray-700">Uscite per categoria (questo mese)</p>
          <div className="space-y-2">
            {byCategory.map(([cat, value]) => (
              <div key={cat}>
                <div className="mb-1 flex justify-between text-xs text-gray-500">
                  <span>{cat}</span>
                  <span>{eur.format(value)}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-brand-500"
                    style={{ width: `${maxCategory ? (value / maxCategory) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Movimenti del mese</p>
        {loading ? (
          <p className="text-sm text-gray-400">Caricamento…</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-gray-400">Nessun movimento questo mese.</p>
        ) : (
          <ul className="space-y-2">
            {transactions.map((t) => (
              <li key={t.id} className="card flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t.category}
                    {t.description ? ` · ${t.description}` : ""}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(t.occurred_on).toLocaleDateString("it-IT")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-semibold ${
                      t.type === "income" ? "text-brand-700" : "text-red-600"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {eur.format(Number(t.amount))}
                  </span>
                  <button onClick={() => remove(t.id)} className="text-gray-300 hover:text-red-500">
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
