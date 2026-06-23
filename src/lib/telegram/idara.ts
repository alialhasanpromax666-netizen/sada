import { db } from "@/lib/db";
import { kashf } from "@/lib/tashfeer";
import {
  BotTelegram,
  fakkSirrTelegram,
  rabitRisala,
  type MaalumatKhattaf,
} from "./telegram";

export interface BotMuhammal {
  bot: BotTelegram;
  qanat?: string;
  miftahId: string;
  laqab: string;
}

export async function jalbBotMustakhdim(
  mustakhdimId: string,
): Promise<BotMuhammal | null> {
  const miftah = await db.miftah.findFirst({
    where: { mustakhdimId, manassa: "TELEGRAM", fa3aal: true },
    orderBy: { createdAt: "desc" },
  });
  if (!miftah) return null;

  let sirr: string;
  try {
    sirr = kashf(miftah.qimaMushaffara);
  } catch {
    return null;
  }

  const { token, qanat } = fakkSirrTelegram(sirr);
  return {
    bot: new BotTelegram(token),
    qanat,
    miftahId: miftah.id,
    laqab: miftah.laqab,
  };
}

export interface HalatQanat {
  mawsul: boolean;
  bot?: string;
  qanat?: string;
  ismQanat?: string;
  mushtarikun?: number;
  khattaf?: { mansub: boolean; url?: string; muallaqa?: number };
  khata?: string;
  manshurat?: number;
}

export async function halatQanat(mustakhdimId: string): Promise<HalatQanat> {
  const muhammal = await jalbBotMustakhdim(mustakhdimId);

  const manshurat = await db.manshur.count({
    where: { manassa: "TELEGRAM", wakeel: { mustakhdimId } },
  });

  if (!muhammal) {
    return { mawsul: false, manshurat };
  }

  const { bot, qanat } = muhammal;

  const me = await bot.getMe();
  if (!me.ok || !me.result) {
    return {
      mawsul: true,
      qanat,
      khata: me.description ?? "رمز البوت غير صالح.",
      manshurat,
    };
  }

  const halat: HalatQanat = {
    mawsul: true,
    bot: me.result.username,
    qanat,
    manshurat,
  };

  const kh = await bot.getWebhookInfo();
  if (kh.ok && kh.result) {
    const r = kh.result as MaalumatKhattaf;
    halat.khattaf = {
      mansub: Boolean(r.url),
      url: r.url || undefined,
      muallaqa: r.pending_update_count,
    };
  }

  if (qanat) {
    const chat = await bot.getChat(qanat);
    if (chat.ok && chat.result) {
      halat.ismQanat = chat.result.title ?? qanat;
      const adad = await bot.getChatMemberCount(qanat);
      if (adad.ok) halat.mushtarikun = adad.result;
    } else {
      halat.khata = `تعذّر الوصول للقناة ${qanat}: ${
        chat.description ?? "تأكّد أنّ البوت مشرف فيها."
      }`;
    }
  }

  return halat;
}

export interface NatijatBath {
  najah: boolean;
  maerifNashr?: string;
  rabit?: string;
  khata?: string;
}

export async function bathRisala(
  mustakhdimId: string,
  matn: string,
  thabbit = false,
): Promise<NatijatBath> {
  const muhammal = await jalbBotMustakhdim(mustakhdimId);
  if (!muhammal) {
    return { najah: false, khata: "لا يوجد بوت تيليغرام مفعّل في خزنة المفاتيح." };
  }
  if (!muhammal.qanat) {
    return {
      najah: false,
      khata: "لم يُحدَّد معرّف القناة. خزّن المفتاح بصيغة «الرمز|@القناة».",
    };
  }

  const { bot, qanat } = muhammal;
  const radd = await bot.sendMessage(qanat, matn);
  if (!radd.ok || !radd.result) {
    return { najah: false, khata: radd.description ?? "فشل البثّ." };
  }

  const messageId = radd.result.message_id;
  if (thabbit) await bot.pinChatMessage(qanat, messageId);

  return {
    najah: true,
    maerifNashr: String(messageId),
    rabit: rabitRisala(qanat, messageId),
  };
}

export function sirrKhattaf(): string | undefined {
  return process.env.SADA_TELEGRAM_WEBHOOK_SECRET || undefined;
}

export function rabitKhattaf(): string {
  const asas = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${asas.replace(/\/$/, "")}/api/telegram/webhook`;
}
