/**
 * ════════════════════════════════════════════════════════════
 *  تَشْفِير (Tashfeer) — وحدة التشفير المتماثل للأسرار
 * ════════════════════════════════════════════════════════════
 *
 * الفلسفة الأمنية:
 *   - مفاتيح API هي أثمن ما يملكه المستخدم. لا تُخزَّن خاماً أبداً.
 *   - نستخدم AES-256-GCM: تشفير مُصادَق (Authenticated Encryption)
 *     يضمن السرّية + سلامة البيانات معاً (يكشف أي عبث).
 *   - لكل عملية تشفير متّجه تهيئة (IV) عشوائي فريد — لا تكرار.
 *
 * صيغة المخرجات المخزّنة:
 *   "<iv>:<authTag>:<ciphertext>"   (كل جزء مُرمّز base64)
 *
 * المفتاح الرئيسي:
 *   يُقرأ من البيئة SADA_MASTER_KEY (32 بايت بصيغة base64).
 *   توليده:  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */

import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  timingSafeEqual,
} from "crypto";

const KHWARZIMIYYA = "aes-256-gcm" as const; // الخوارزمية
const TUL_IV = 12; // طول متّجه التهيئة (12 بايت موصى به لـ GCM)
const TUL_MIFTAH = 32; // 256 بت

/**
 * يقرأ ويتحقّق من المفتاح الرئيسي. يرمي خطأً واضحاً إن كان غائباً/خاطئاً.
 */
function jalbMiftahRaisi(): Buffer {
  const khaam = process.env.SADA_MASTER_KEY;
  if (!khaam) {
    throw new Error(
      "[صَدَى/تشفير] المفتاح الرئيسي SADA_MASTER_KEY غير معرّف في البيئة. " +
        'وَلِّده عبر: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"',
    );
  }
  const miftah = Buffer.from(khaam, "base64");
  if (miftah.length !== TUL_MIFTAH) {
    throw new Error(
      `[صَدَى/تشفير] طول المفتاح الرئيسي غير صحيح: ${miftah.length} بايت (المطلوب ${TUL_MIFTAH}).`,
    );
  }
  return miftah;
}

/**
 * تأمين (Encrypt): يحوّل نصّاً سرّياً إلى نص مشفّر مُصادَق قابل للتخزين.
 *
 * @param sirr النص الخام (مثل مفتاح API)
 * @returns سلسلة بصيغة "iv:authTag:ciphertext"
 */
export function taamin(sirr: string): string {
  const miftah = jalbMiftahRaisi();
  const iv = randomBytes(TUL_IV);

  const mushaffir = createCipheriv(KHWARZIMIYYA, miftah, iv);
  const mushaffar = Buffer.concat([
    mushaffir.update(sirr, "utf8"),
    mushaffir.final(),
  ]);
  const authTag = mushaffir.getAuthTag();

  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    mushaffar.toString("base64"),
  ].join(":");
}

/**
 * كشف (Decrypt): يستعيد النص الخام من النص المشفّر.
 * يرمي خطأً إن جرى العبث بالبيانات (فشل المصادقة).
 *
 * @param maktum السلسلة المشفّرة المخزّنة ("iv:authTag:ciphertext")
 * @returns النص الخام الأصلي
 */
export function kashf(maktum: string): string {
  const miftah = jalbMiftahRaisi();
  const ajzaa = maktum.split(":");
  if (ajzaa.length !== 3) {
    throw new Error("[صَدَى/تشفير] صيغة النص المشفّر غير صالحة.");
  }
  const [ivB64, tagB64, dataB64] = ajzaa;

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const fakkak = createDecipheriv(KHWARZIMIYYA, miftah, iv);
  fakkak.setAuthTag(authTag);

  const khaam = Buffer.concat([fakkak.update(data), fakkak.final()]);
  return khaam.toString("utf8");
}

/**
 * بصمة (Fingerprint): آخر 4 أحرف من السرّ — للعرض الآمن في الواجهة
 * دون كشف القيمة الكاملة (مثل ‎•••• abcd).
 */
export function basma(sirr: string): string {
  return sirr.slice(-4);
}

/**
 * مقارنة آمنة زمنياً بين سلسلتين (تمنع هجمات التوقيت).
 */
export function muqaranaAamina(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * فحص جاهزية التشفير — يُستخدم في صفحة الإعدادات للتحقّق من البيئة.
 */
export function tashfeerJahiz(): boolean {
  try {
    jalbMiftahRaisi();
    return true;
  } catch {
    return false;
  }
}
