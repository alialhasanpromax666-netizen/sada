/**
 * واجهة إدارة قناة تيليغرام.
 *
 * GET  /api/telegram/idara             → حالة القناة (بوت، مشتركون، ويبهوك)
 * POST /api/telegram/idara  { amal }   → إجراء إداري:
 *        - "webhook-set"     ضبط خطّاف الويب لاستقبال الأوامر
 *        - "webhook-delete"  إزالة خطّاف الويب
 *        - "iblagh"          بثّ إعلان للقناة { matn, thabbit? }
 *
 * تستخدم النواة crypto لفكّ تشفير المفتاح — نفرض بيئة Node.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";
import { ansha2Ishaar } from "@/lib/isharat";
import {
  halatQanat,
  jalbBotMustakhdim,
  bathRisala,
  rabitKhattaf,
  sirrKhattaf,
} from "@/lib/telegram/idara";
import { nashrTilqaiTelegram } from "@/lib/telegram/nashr-tilqai";
import type { RamzManassa } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const m = await jalbMustakhdimHali();
  const [halat, wukalaKull, mustakhdim] = await Promise.all([
    halatQanat(m.id),
    db.wakeel.findMany({
      where: { mustakhdimId: m.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, ism: true, manassat: true, namudhaj: true, muzawwid: true },
    }),
    db.mustakhdim.findUnique({
      where: { id: m.id },
      select: { wakeelTelegramId: true },
    }),
  ]);

  // المرشّحون للنشر الذاتي: الوكلاء الذين يستهدفون تيليغرام.
  const wukala = wukalaKull
    .filter((w) => (JSON.parse(w.manassat) as RamzManassa[]).includes("TELEGRAM"))
    .map((w) => ({ id: w.id, ism: w.ism, muzawwid: w.muzawwid, namudhaj: w.namudhaj }));

  return NextResponse.json({
    halat,
    rabitKhattaf: rabitKhattaf(),
    wukala,
    wakeelTelegramId: mustakhdim?.wakeelTelegramId ?? null,
  });
}

export async function POST(req: Request) {
  const m = await jalbMustakhdimHali();
  const { amal, matn, thabbit, wakeelId, mawdu, adad } = (await req.json()) as {
    amal?: string;
    matn?: string;
    thabbit?: boolean;
    wakeelId?: string;
    mawdu?: string;
    adad?: number;
  };

  switch (amal) {
    case "webhook-set": {
      const muhammal = await jalbBotMustakhdim(m.id);
      if (!muhammal) {
        return NextResponse.json(
          { najah: false, risala: "لا يوجد بوت مفعّل." },
          { status: 400 },
        );
      }
      const radd = await muhammal.bot.setWebhook(rabitKhattaf(), sirrKhattaf());
      if (!radd.ok) {
        return NextResponse.json(
          { najah: false, risala: radd.description ?? "تعذّر ضبط الخطّاف." },
          { status: 502 },
        );
      }
      await ansha2Ishaar({
        mustakhdimId: m.id,
        naw3: "NAJAH",
        unwan: "فُعِّل خطّاف تيليغرام",
        matn: "أصبح البوت يستقبل أوامر إدارة القناة.",
      });
      return NextResponse.json({ najah: true, risala: "ضُبط خطّاف الويب بنجاح." });
    }

    case "webhook-delete": {
      const muhammal = await jalbBotMustakhdim(m.id);
      if (!muhammal) {
        return NextResponse.json(
          { najah: false, risala: "لا يوجد بوت مفعّل." },
          { status: 400 },
        );
      }
      const radd = await muhammal.bot.deleteWebhook();
      if (!radd.ok) {
        return NextResponse.json(
          { najah: false, risala: radd.description ?? "تعذّر إزالة الخطّاف." },
          { status: 502 },
        );
      }
      return NextResponse.json({ najah: true, risala: "أُزيل خطّاف الويب." });
    }

    case "iblagh": {
      if (!matn || !matn.trim()) {
        return NextResponse.json(
          { najah: false, risala: "نصّ الإعلان مطلوب." },
          { status: 400 },
        );
      }
      const natija = await bathRisala(m.id, matn.trim(), Boolean(thabbit));
      if (natija.najah) {
        await ansha2Ishaar({
          mustakhdimId: m.id,
          naw3: "NAJAH",
          unwan: "بُثّ إعلان على تيليغرام",
          matn: `أُرسل إعلان إلى القناة${thabbit ? " وثُبّت في أعلاها" : ""}.`,
        });
        return NextResponse.json({ ...natija, risala: "بُثّ الإعلان." });
      }
      return NextResponse.json(
        { najah: false, risala: natija.khata },
        { status: 502 },
      );
    }

    case "rabt-wakeel": {
      // ربط (أو فكّ ربط) وكيل بالقناة للنشر الذاتي.
      if (wakeelId) {
        const w = await db.wakeel.findFirst({
          where: { id: wakeelId, mustakhdimId: m.id },
          select: { id: true },
        });
        if (!w) {
          return NextResponse.json(
            { najah: false, risala: "الوكيل غير موجود." },
            { status: 404 },
          );
        }
      }
      await db.mustakhdim.update({
        where: { id: m.id },
        data: { wakeelTelegramId: wakeelId || null },
      });
      return NextResponse.json({
        najah: true,
        risala: wakeelId ? "رُبط الوكيل بالقناة." : "أُلغي ربط الوكيل.",
      });
    }

    case "nashr-tilqai": {
      const natija = await nashrTilqaiTelegram(m.id, { wad3: "fawri", mawdu });
      if (natija.najah) {
        return NextResponse.json({
          najah: true,
          risala: "وَلّد الوكيل منشوراً ونشره في القناة.",
        });
      }
      return NextResponse.json(
        { najah: false, risala: natija.khata },
        { status: 502 },
      );
    }

    case "jadwala-tilqaiya": {
      const natija = await nashrTilqaiTelegram(m.id, {
        wad3: "jadwala",
        mawdu,
        adad,
      });
      if (natija.najah) {
        return NextResponse.json({
          najah: true,
          risala: `جُدول ${natija.majdwala} منشوراً تلقائياً في أوقات الذروة.`,
        });
      }
      return NextResponse.json(
        { najah: false, risala: natija.khata },
        { status: 502 },
      );
    }

    default:
      return NextResponse.json(
        { najah: false, risala: "إجراء غير معروف." },
        { status: 400 },
      );
  }
}
