/**
 * ════════════════════════════════════════════════════════════
 *  بُوت تيليغرام (BotTelegram) — غلاف رفيع حول Bot API
 * ════════════════════════════════════════════════════════════
 *
 * عميل بسيط بلا تبعيات يغلّف نقاط Bot API التي تحتاجها صَدَى لإدارة
 * قناة ونشر محتواها: هويّة البوت، معلومات القناة، عدد المشتركين،
 * إرسال/تثبيت/حذف الرسائل، وإدارة خطّاف الويب (Webhook).
 *
 * كل النداءات تمرّ عبر `nida` التي توحّد الشكل والأخطاء، فتُرجِع دائماً
 * `RaddTelegram` بدل أن ترمي — ليتعامل المستدعي مع `ok` بثبات.
 *
 * صيغة السرّ المخزَّن (مفتاح خزنة المفاتيح لمنصّة TELEGRAM):
 *   "<رمز البوت>|<معرّف القناة>"
 *   مثال:  123456789:AA…xyz|@my_channel   أو   123456789:AA…xyz|-1001234567890
 * الرمز فقط دون قناة مسموح به للاختبار، لكنّ النشر يتطلّب القناة.
 */

const QAEDA = "https://api.telegram.org";

/** الشكل الموحّد لردّ Bot API. */
export interface RaddTelegram<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

/** هويّة البوت (getMe). */
export interface HuwiyyatBot {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
}

/** معلومات الدردشة/القناة (getChat). */
export interface MaalumatQanat {
  id: number;
  type: string; // "channel" | "supergroup" | "group" | "private"
  title?: string;
  username?: string;
  description?: string;
}

/** معلومات خطّاف الويب (getWebhookInfo). */
export interface MaalumatKhattaf {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_message?: string;
}

/** رسالة منشورة (نتيجة sendMessage). */
export interface RisalaTelegram {
  message_id: number;
  chat: { id: number; username?: string; title?: string };
}

/**
 * يفكّ سرّ تيليغرام المخزَّن إلى رمز البوت ومعرّف القناة.
 * الفاصل `|` آمن لأنه لا يظهر في رموز البوت ولا في معرّفات القنوات.
 */
export function fakkSirrTelegram(sirr: string): { token: string; qanat?: string } {
  const faasil = sirr.indexOf("|");
  if (faasil === -1) return { token: sirr.trim() };
  const token = sirr.slice(0, faasil).trim();
  const qanat = sirr.slice(faasil + 1).trim();
  return { token, qanat: qanat || undefined };
}

/**
 * يبني رابط رسالة قناة قابلاً للنقر (أفضل جهد).
 *   - قناة عامّة (@username) → https://t.me/username/<id>
 *   - قناة خاصّة (-100…)    → https://t.me/c/<internal>/<id>
 */
export function rabitRisala(
  qanat: string | undefined,
  messageId: number,
): string | undefined {
  if (!qanat) return undefined;
  if (qanat.startsWith("@")) {
    return `https://t.me/${qanat.slice(1)}/${messageId}`;
  }
  const khaass = qanat.match(/^-100(\d+)$/);
  if (khaass) return `https://t.me/c/${khaass[1]}/${messageId}`;
  return undefined;
}

export class BotTelegram {
  constructor(private readonly token: string) {}

  /** نداء موحّد لأي تابع في Bot API. لا يرمي أبداً — يُرجِع RaddTelegram. */
  private async nida<T>(
    tariqa: string,
    jism?: Record<string, unknown>,
  ): Promise<RaddTelegram<T>> {
    try {
      const radd = await fetch(`${QAEDA}/bot${this.token}/${tariqa}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jism ?? {}),
      });
      return (await radd.json()) as RaddTelegram<T>;
    } catch (e) {
      return { ok: false, description: (e as Error).message };
    }
  }

  /** هويّة البوت — يتحقّق من صلاحية الرمز. */
  getMe() {
    return this.nida<HuwiyyatBot>("getMe");
  }

  /** معلومات القناة (العنوان، المعرّف، الوصف). */
  getChat(qanat: string) {
    return this.nida<MaalumatQanat>("getChat", { chat_id: qanat });
  }

  /** عدد المشتركين في القناة. */
  getChatMemberCount(qanat: string) {
    return this.nida<number>("getChatMemberCount", { chat_id: qanat });
  }

  /** إرسال رسالة نصّية إلى القناة. */
  sendMessage(
    qanat: string,
    matn: string,
    khiyarat?: { parse_mode?: "HTML" | "MarkdownV2"; disable_notification?: boolean },
  ) {
    return this.nida<RisalaTelegram>("sendMessage", {
      chat_id: qanat,
      text: matn,
      ...khiyarat,
    });
  }

  /** إرسال صورة مع تعليق. */
  sendPhoto(
    qanat: string,
    suraUrl: string,
    tawsif?: string,
    khiyarat?: { parse_mode?: "HTML" | "MarkdownV2"; disable_notification?: boolean },
  ) {
    return this.nida<RisalaTelegram>("sendPhoto", {
      chat_id: qanat,
      photo: suraUrl,
      caption: tawsif ?? "",
      ...khiyarat,
    });
  }

  /** تثبيت رسالة في أعلى القناة. */
  pinChatMessage(qanat: string, messageId: number, sami3?: boolean) {
    return this.nida<boolean>("pinChatMessage", {
      chat_id: qanat,
      message_id: messageId,
      disable_notification: !sami3,
    });
  }

  /** حذف رسالة من القناة. */
  deleteMessage(qanat: string, messageId: number) {
    return this.nida<boolean>("deleteMessage", {
      chat_id: qanat,
      message_id: messageId,
    });
  }

  /** ضبط خطّاف الويب لاستقبال أوامر إدارة القناة. */
  setWebhook(url: string, secretToken?: string) {
    return this.nida<boolean>("setWebhook", {
      url,
      secret_token: secretToken,
      allowed_updates: ["message", "channel_post"],
      drop_pending_updates: true,
    });
  }

  /** إزالة خطّاف الويب. */
  deleteWebhook() {
    return this.nida<boolean>("deleteWebhook", { drop_pending_updates: true });
  }

  /** حالة خطّاف الويب الحالي. */
  getWebhookInfo() {
    return this.nida<MaalumatKhattaf>("getWebhookInfo");
  }
}
