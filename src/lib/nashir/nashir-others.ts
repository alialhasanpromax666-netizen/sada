import { Nashir } from "./nashir-base";
import type { NatijatNashr, NatijatIkhtibar, RamzManassa } from "@/lib/types";

// ── لينكدإن ──────────────────────────────────────────────────
export class NashirLinkedIn extends Nashir {
  readonly manassa: RamzManassa = "LINKEDIN";

  async nashr(matn: string, miftah: string): Promise<NatijatNashr> {
    try {
      const muRadd = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${miftah}` },
      });
      if (!muRadd.ok) return { najah: false, khata: "تعذّر جلب هوية العضو من لينكدإن." };
      const { sub } = (await muRadd.json()) as { sub: string };

      const radd = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${miftah}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: `urn:li:person:${sub}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: matn },
              shareMediaCategory: "NONE",
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
          },
        }),
      });
      const maerif = radd.headers.get("x-restli-id") ?? undefined;
      if (!radd.ok) return { najah: false, khata: `فشل النشر (HTTP ${radd.status})` };
      return { najah: true, maerifNashr: maerif };
    } catch (e) {
      return { najah: false, khata: (e as Error).message };
    }
  }

  async ikhtibar(miftah: string): Promise<NatijatIkhtibar> {
    try {
      const radd = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${miftah}` },
      });
      if (!radd.ok) return { najah: false, risala: "مفتاح لينكدإن غير صالح." };
      const data = (await radd.json()) as { name?: string };
      return { najah: true, risala: `متّصل: ${data.name ?? "عضو لينكدإن"}` };
    } catch (e) {
      return { najah: false, risala: (e as Error).message };
    }
  }
}

// ── ميتا (إنستغرام/فيسبوك عبر Graph API) ─────────────────────
export class NashirMeta extends Nashir {
  // في الإنتاج، يُضبط ديناميكياً حسب المنصّة الفعلية المستدعاة.
  readonly manassa: RamzManassa = "INSTAGRAM";

  async nashr(matn: string, miftah: string): Promise<NatijatNashr> {
    // نشر إنستغرام عبر Graph API عملية من خطوتين:
    //   1) POST /{ig-user-id}/media       ← إنشاء حاوية وسائط (media container)
    //   2) POST /{ig-user-id}/media_publish ← نشر الحاوية
    // يتطلّب: معرّف حساب IG-User (يُحفظ ضمن المفتاح أو يُستخرج من Graph API)
    //
    // TBD: يتطلّب رفع صورة/فيديو كأساس (Graph API لا يدعم النص البحت).
    // عند توفر المفاتيح الحقيقية، أتمِم التدفّق في هذه الدالة.
    try {
      const radd = await fetch(
        `https://graph.facebook.com/v21.0/me?access_token=${encodeURIComponent(miftah)}`,
      );
      if (!radd.ok)
        return { najah: false, khata: "رمز ميتا غير صالح. يلزم إكمال تدفّق النشر بمفاتيح حقيقية." };
      return {
        najah: false,
        khata: "نشر ميتا يتطلّب معرّف حساب IG-User وتدفّق رفع وسائط (انظر التعليقات في الكود).",
      };
    } catch (e) {
      return { najah: false, khata: (e as Error).message };
    }
  }

  async ikhtibar(miftah: string): Promise<NatijatIkhtibar> {
    try {
      const radd = await fetch(
        `https://graph.facebook.com/v21.0/me?access_token=${encodeURIComponent(miftah)}`,
      );
      const data = (await radd.json()) as { name?: string; error?: { message: string } };
      if (!radd.ok || data.error)
        return { najah: false, risala: data.error?.message ?? "رمز غير صالح." };
      return { najah: true, risala: `متّصل: ${data.name ?? "حساب ميتا"}` };
    } catch (e) {
      return { najah: false, risala: (e as Error).message };
    }
  }
}

// ── تيك توك (Content Posting API) ────────────────────────────
export class NashirTikTok extends Nashir {
  readonly manassa: RamzManassa = "TIKTOK";

  async nashr(matn: string, miftah: string): Promise<NatijatNashr> {
    // نشر تيك توك يتطلّب فيديو عبر Content Posting API:
    //   1) POST /v2/video/query/    ← استعلام صلاحية النشر
    //   2) POST /v2/video/publish/  ← رفع الفيديو ونشره
    //
    // TBD: يدعم تيك توك محتوى نصياً فقط ضمن caption الفيديو.
    // النشر النصّي البحت غير مدعوم مباشرة.
    return {
      najah: false,
      khata: "يتطلّب تيك توك محتوى فيديو عبر Content Posting API (انظر التعليقات في الكود).",
    };
  }

  async ikhtibar(miftah: string): Promise<NatijatIkhtibar> {
    try {
      const radd = await fetch("https://open.tiktokapis.com/v2/user/info/", {
        headers: { Authorization: `Bearer ${miftah}` },
      });
      if (!radd.ok) return { najah: false, risala: "رمز تيك توك غير صالح." };
      return { najah: true, risala: "متّصل بحساب تيك توك." };
    } catch (e) {
      return { najah: false, risala: (e as Error).message };
    }
  }
}
