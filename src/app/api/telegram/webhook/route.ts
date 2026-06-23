/**
 * خطّاف ويب تيليغرام (Webhook) — مدخل أوامر إدارة القناة.
 *
 * POST /api/telegram/webhook   ← يستدعيه تيليغرام عند كل تحديث.
 *
 * يستقبل الرسائل الموجّهة للبوت ويستجيب لأوامر الإدارة:
 *   /help | /مساعدة      عرض الأوامر
 *   /halat | /الحالة     حالة القناة (بوت، مشتركون، ويبهوك)
 *   /ihsaiyat | /احصاء   إحصاء منشورات تيليغرام
 *   /iblagh <نص>         بثّ إعلان إلى القناة (إداري)
 *
 * الأمان:
 *   - يتحقّق من ترويسة X-Telegram-Bot-Api-Secret-Token إن عُرّف السرّ.
 *   - أمر البثّ يُقيَّد بمعرّف المشرف SADA_TELEGRAM_ADMIN_ID إن عُرّف.
 * يردّ دائماً بـ 200 (عدا فشل المصادقة) كي لا يعيد تيليغرام الإرسال.
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jalbMustakhdimHali } from "@/lib/mustakhdim";
import {
  jalbBotMustakhdim,
  halatQanat,
  bathRisala,
  sirrKhattaf,
} from "@/lib/telegram/idara";

export const runtime = "nodejs";

interface TahdithTelegram {
  message?: RisalaWarida;
  channel_post?: RisalaWarida;
}
interface RisalaWarida {
  text?: string;
  chat: { id: number; type: string };
  from?: { id: number; first_name?: string };
}

const HELP = [
   "أوامر إدارة قناة صَدَى:",
  "",
  "/halat — حالة القناة والاتصال",
  "/ihsaiyat — إحصاء منشورات تيليغرام",
  "/iblagh <نص> — بثّ إعلان إلى القناة",
  "/help — عرض هذه القائمة",
].join("\n");

/** يطابق أمراً مع مرادفاته العربية واللاتينية. */
function huwa(cmd: string, ...badaiil: string[]): boolean {
  return badaiil.includes(cmd);
}

export async function POST(req: Request) {
  // التحقّق من السرّ المشترك إن عُرّف.
  const sirr = sirrKhattaf();
  if (sirr) {
    const warid = req.headers.get("x-telegram-bot-api-secret-token");
    if (warid !== sirr) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  try {
    const tahdith = (await req.json()) as TahdithTelegram;
    const risala = tahdith.message ?? tahdith.channel_post;
    const matn = risala?.text?.trim();

    // لا نتعامل إلّا مع الأوامر النصّية.
    if (!risala || !matn || !matn.startsWith("/")) {
      return NextResponse.json({ ok: true });
    }

    const [khaam, ...baqi] = matn.split(/\s+/);
    const cmd = khaam.slice(1).split("@")[0].toLowerCase();
    const muaamil = baqi.join(" ").trim();
    const chatId = String(risala.chat.id);

    const m = await jalbMustakhdimHali();
    const muhammal = await jalbBotMustakhdim(m.id);
    if (!muhammal) return NextResponse.json({ ok: true });
    const { bot } = muhammal;

    const radd = (n: string) => bot.sendMessage(chatId, n);

    if (huwa(cmd, "start", "help", "مساعدة", "المساعدة")) {
      await radd(HELP);
    } else if (huwa(cmd, "halat", "status", "الحالة")) {
      const h = await halatQanat(m.id);
      await radd(
        [
          "حالة القناة:",
          `• البوت: ${h.bot ? "@" + h.bot : "غير متّصل"}`,
          `• القناة: ${h.ismQanat ?? h.qanat ?? "غير محدّدة"}`,
          `• المشتركون: ${h.mushtarikun ?? "—"}`,
           `• الويبهوك: ${h.khattaf?.mansub ? "مفعّل" : "معطّل"}`,
          h.khata ? `\n**ملاحظة:** ${h.khata}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      );
    } else if (huwa(cmd, "ihsaiyat", "stats", "احصاء", "إحصاء")) {
      const [kulli, manshura, fashila] = await Promise.all([
        db.manshur.count({
          where: { manassa: "TELEGRAM", wakeel: { mustakhdimId: m.id } },
        }),
        db.manshur.count({
          where: {
            manassa: "TELEGRAM",
            hala: "MANSHUR",
            wakeel: { mustakhdimId: m.id },
          },
        }),
        db.manshur.count({
          where: {
            manassa: "TELEGRAM",
            hala: "FASHIL",
            wakeel: { mustakhdimId: m.id },
          },
        }),
      ]);
      await radd(
        [
          "📈 إحصاء منشورات تيليغرام:",
          `• الإجمالي: ${kulli}`,
          `• المنشورة: ${manshura}`,
          `• الفاشلة: ${fashila}`,
        ].join("\n"),
      );
    } else if (huwa(cmd, "iblagh", "broadcast", "اعلان", "إعلان")) {
      // قيد إداري اختياري.
      const adminId = process.env.SADA_TELEGRAM_ADMIN_ID;
      if (adminId && String(risala.from?.id) !== adminId) {
        await radd("غير مصرّح لك ببثّ الإعلانات.");
      } else if (!muaamil) {
        await radd("اكتب نصّ الإعلان بعد الأمر:\n/iblagh مرحباً بكم في قناتنا");
      } else {
        const natija = await bathRisala(m.id, muaamil);
        await radd(natija.najah ? "بُثّ الإعلان إلى القناة." : `فشل: ${natija.khata}`);
      }
    } else {
      await radd("أمر غير معروف. أرسل /help لعرض الأوامر المتاحة.");
    }

    return NextResponse.json({ ok: true });
  } catch {
    // نبتلع الأخطاء كي لا يعيد تيليغرام إرسال التحديث بلا نهاية.
    return NextResponse.json({ ok: true });
  }
}
