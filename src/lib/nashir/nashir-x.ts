import { Nashir } from "./nashir-base";
import type { NatijatNashr, NatijatIkhtibar, RamzManassa } from "@/lib/types";

const QAEDA = "https://api.twitter.com/2";

export class NashirX extends Nashir {
  readonly manassa: RamzManassa = "X";

  async nashr(matn: string, miftah: string): Promise<NatijatNashr> {
    try {
      const radd = await fetch(`${QAEDA}/tweets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${miftah}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: matn }),
      });

      const data = (await radd.json()) as {
        data?: { id: string };
        detail?: string;
        title?: string;
      };

      if (!radd.ok || !data.data) {
        return {
          najah: false,
          khata: data.detail ?? data.title ?? `فشل النشر (HTTP ${radd.status})`,
        };
      }

      return {
        najah: true,
        maerifNashr: data.data.id,
        rabit: `https://x.com/i/web/status/${data.data.id}`,
      };
    } catch (e) {
      return { najah: false, khata: (e as Error).message };
    }
  }

  async ikhtibar(miftah: string): Promise<NatijatIkhtibar> {
    try {
      const radd = await fetch(`${QAEDA}/users/me`, {
        headers: { Authorization: `Bearer ${miftah}` },
      });
      const data = (await radd.json()) as {
        data?: { username: string };
        detail?: string;
      };

      if (!radd.ok || !data.data) {
        const msg = data.detail ?? "";
        if (msg.includes("oauth") || msg.includes("token") || radd.status === 401) {
          return {
            najah: false,
            risala:
              "تحتاج OAuth 2.0 Access Token (وليس API Key). اذهب إلى Twitter Developer Portal → App → Keys and Tokens → OAuth 2.0 → Generate.",
          };
        }
        return { najah: false, risala: msg || "مفتاح غير صالح أو منتهي." };
      }
      return {
        najah: true,
        risala: `متّصل بحساب @${data.data.username}`,
        tafasil: { username: data.data.username },
      };
    } catch (e) {
      return { najah: false, risala: (e as Error).message };
    }
  }
}
