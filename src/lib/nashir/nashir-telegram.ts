import { Nashir } from "./nashir-base";
import { BotTelegram, fakkSirrTelegram, rabitRisala } from "@/lib/telegram/telegram";
import type { NatijatNashr, NatijatIkhtibar, RamzManassa } from "@/lib/types";

export class NashirTelegram extends Nashir {
  readonly manassa: RamzManassa = "TELEGRAM";

  async nashr(matn: string, miftah: string): Promise<NatijatNashr> {
    const { token, qanat } = fakkSirrTelegram(miftah);
    if (!qanat) {
      return {
        najah: false,
        khata:
          "لم يُحدَّد معرّف القناة. خزّن المفتاح بصيغة «الرمز|@القناة» في خزنة المفاتيح.",
      };
    }

    const bot = new BotTelegram(token);
    const radd = await bot.sendMessage(qanat, matn);
    if (!radd.ok || !radd.result) {
      return { najah: false, khata: radd.description ?? "فشل النشر على تيليغرام." };
    }

    const messageId = radd.result.message_id;
    return {
      najah: true,
      maerifNashr: String(messageId),
      rabit: rabitRisala(qanat, messageId),
    };
  }

  async ikhtibar(miftah: string): Promise<NatijatIkhtibar> {
    const { token, qanat } = fakkSirrTelegram(miftah);
    const bot = new BotTelegram(token);

    const me = await bot.getMe();
    if (!me.ok || !me.result) {
      return { najah: false, risala: me.description ?? "رمز البوت غير صالح." };
    }
    const username = me.result.username;

    if (!qanat) {
      return {
        najah: true,
        risala: `البوت @${username} صالح. أضِف معرّف القناة بصيغة «الرمز|@القناة» لتفعيل النشر.`,
        tafasil: { username },
      };
    }

    const chat = await bot.getChat(qanat);
    if (!chat.ok || !chat.result) {
      return {
        najah: false,
        risala: `البوت @${username} صالح، لكن تعذّر الوصول للقناة ${qanat}: ${
          chat.description ?? "تأكّد أنّ البوت مشرف فيها."
        }`,
      };
    }

    const adad = await bot.getChatMemberCount(qanat);
    const ism = chat.result.title ?? qanat;
    return {
      najah: true,
      risala: adad.ok
        ? `متّصل عبر @${username} بقناة «${ism}» (${adad.result} مشترك).`
        : `متّصل عبر @${username} بقناة «${ism}».`,
      tafasil: {
        username,
        qanat: ism,
        mushtarikun: adad.ok ? adad.result : undefined,
      },
    };
  }
}
