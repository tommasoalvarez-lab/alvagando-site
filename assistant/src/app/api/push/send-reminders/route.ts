import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json({ error: "Chiavi VAPID non configurate" }, { status: 500 });
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:notifiche@example.com", vapidPublic, vapidPrivate);

  const supabase = createAdminClient();
  const now = new Date();

  // Un impegno è "dovuto" quando (inizio - anticipo promemoria) è già passato,
  // ma consideriamo solo le ultime 24 ore per non spammare impegni vecchi/mancati.
  const { data: events, error } = await supabase
    .from("events")
    .select("id, user_id, title, notes, start_at, reminder_minutes_before")
    .eq("notified", false)
    .lte("start_at", new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString())
    .gte("start_at", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const due = (events ?? []).filter((ev) => {
    const remindAt = new Date(ev.start_at).getTime() - ev.reminder_minutes_before * 60 * 1000;
    return remindAt <= now.getTime();
  });

  let sent = 0;
  for (const ev of due) {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, subscription")
      .eq("user_id", ev.user_id);

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          sub.subscription as any,
          JSON.stringify({
            title: `⏰ ${ev.title}`,
            body: ev.notes || new Date(ev.start_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
            url: "/agenda",
          })
        );
        sent += 1;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }

    await supabase.from("events").update({ notified: true }).eq("id", ev.id);
  }

  return NextResponse.json({ checked: events?.length ?? 0, due: due.length, sent });
}
