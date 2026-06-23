/**
 * كَشْف القنوات — يكتشف القنوات التي أُضيف إليها البوت مشرفاً.
 *
 * POST /api/telegram/kashf-qanawat  { token }
 *   ← { najah, qanawat?: [{ id, ism }], khata? }
 *
 * يستخدم getUpdates للعثور على القنوات في أحداث my_chat_member
 * و channel_post التي تلقّاها البوت مؤخّراً.
 */
import { NextResponse } from "next/server";
import { BotTelegram } from "@/lib/telegram/telegram";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { token } = (await req.json()) as { token?: string };
  if (!token || !token.trim()) {
    return NextResponse.json(
      { najah: false, khata: "رمز البوت مطلوب." },
      { status: 400 },
    );
  }

  const bot = new BotTelegram(token.trim());

  // 1) تحقق من صلاحية الرمز
  const me = await bot.getMe();
  if (!me.ok || !me.result) {
    return NextResponse.json(
      { najah: false, khata: me.description ?? "رمز البوت غير صالح." },
      { status: 400 },
    );
  }

  // 2) اسحب آخر التحديثات للعثور على قنوات البوت
  const QAEDA = "https://api.telegram.org";
  let updates: { ok: boolean; result?: Array<Record<string, unknown>> };
  try {
    const radd = await fetch(
      `${QAEDA}/bot${token.trim()}/getUpdates`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowed_updates: ["my_chat_member", "channel_post"],
          limit: 100,
        }),
      },
    );
    updates = await radd.json();
  } catch (e) {
    return NextResponse.json(
      { najah: false, khata: (e as Error).message },
      { status: 502 },
    );
  }

  const qanawat = new Map<string, string>(); // id → ism

  if (updates.ok && Array.isArray(updates.result)) {
    for (const u of updates.result) {
      // my_chat_member: أُضيف البوت مشرفاً لقناة
      const mcm = (u as Record<string, unknown>).my_chat_member as
        | Record<string, unknown>
        | undefined;
      if (mcm) {
        const chat = mcm.chat as Record<string, unknown> | undefined;
        if (chat && (chat.type === "channel" || chat.type === "supergroup")) {
          const id = String(chat.id);
          if (!qanawat.has(id)) {
            qanawat.set(id, String(chat.title ?? chat.username ?? id));
          }
        }
      }
      // channel_post: منشور من قناة وصل للبوت
      const cp = (u as Record<string, unknown>).channel_post as
        | Record<string, unknown>
        | undefined;
      if (cp) {
        const chat = cp.chat as Record<string, unknown> | undefined;
        if (chat) {
          const id = String(chat.id);
          if (!qanawat.has(id)) {
            qanawat.set(id, String(chat.title ?? chat.username ?? id));
          }
        }
      }
    }
  }

  const natija = Array.from(qanawat.entries()).map(([id, ism]) => ({
    id,
    ism,
  }));

  return NextResponse.json({
    najah: true,
    bot: me.result.username,
    qanawat: natija,
  });
}
