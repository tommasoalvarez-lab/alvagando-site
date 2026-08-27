"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PushRegister from "@/components/PushRegister";

type Event = {
  id: string;
  title: string;
  notes: string | null;
  start_at: string;
  reminder_minutes_before: number;
};

const REMINDER_OPTIONS = [
  { value: 0, label: "All'orario esatto" },
  { value: 10, label: "10 minuti prima" },
  { value: 30, label: "30 minuti prima" },
  { value: 60, label: "1 ora prima" },
  { value: 1440, label: "1 giorno prima" },
];

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default function AgendaPage() {
  const supabase = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [startAt, setStartAt] = useState(() => toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000)));
  const [reminder, setReminder] = useState(30);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("events")
      .select("id, title, notes, start_at, reminder_minutes_before")
      .gte("start_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("start_at", { ascending: true });
    setEvents(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const ev of events) {
      const key = new Date(ev.start_at).toLocaleDateString("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      map.set(key, [...(map.get(key) ?? []), ev]);
    }
    return [...map.entries()];
  }, [events]);

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    await supabase.from("events").insert({
      user_id: user.id,
      title: title.trim(),
      notes: notes || null,
      start_at: new Date(startAt).toISOString(),
      reminder_minutes_before: reminder,
    });

    setTitle("");
    setNotes("");
    setSaving(false);
    load();
  }

  async function remove(id: string) {
    await supabase.from("events").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="space-y-5">
      <PushRegister />

      <form onSubmit={addEvent} className="card space-y-3">
        <div>
          <label className="label">Cosa</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="es. Dentista"
            required
          />
        </div>
        <div>
          <label className="label">Quando</label>
          <input
            type="datetime-local"
            className="input"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Promemoria</label>
          <select className="input" value={reminder} onChange={(e) => setReminder(Number(e.target.value))}>
            {REMINDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Note (opzionale)</label>
          <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? "Salvataggio…" : "Aggiungi impegno"}
        </button>
      </form>

      <div className="space-y-4">
        {loading ? (
          <p className="text-sm text-gray-400">Caricamento…</p>
        ) : grouped.length === 0 ? (
          <p className="text-sm text-gray-400">Nessun impegno in programma.</p>
        ) : (
          grouped.map(([day, dayEvents]) => (
            <div key={day}>
              <p className="mb-2 text-sm font-medium capitalize text-gray-700">{day}</p>
              <ul className="space-y-2">
                {dayEvents.map((ev) => (
                  <li key={ev.id} className="card flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ev.title}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(ev.start_at).toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {ev.notes ? ` · ${ev.notes}` : ""}
                      </p>
                    </div>
                    <button onClick={() => remove(ev.id)} className="text-gray-300 hover:text-red-500">
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
