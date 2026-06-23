/**
 * ════════════════════════════════════════════════════════════
 *  الأنواع والثوابت المشتركة عبر صَدَى
 * ════════════════════════════════════════════════════════════
 */

// ── حالات الكيانات (نصوص بدل enums لتوافق SQLite) ───────────
export type WakeelHala = "NAA_IM" | "NASHIT" | "MUAALLAQ";
export type ManshurHala =
  | "MUSAWWADA"
  | "MAJDWAL"
  | "QAYD_NASHR"
  | "MANSHUR"
  | "FASHIL";
export type IshaarNaw3 = "MA3LUMA" | "NAJAH" | "TAHDHIR" | "KHATA";

// ── رموز المنصّات المدعومة ───────────────────────────────────
export type RamzManassa =
  | "X"
  | "LINKEDIN"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "TIKTOK"
  | "TELEGRAM";

// ── رموز خدمات المفاتيح ─────────────────────────────────────
export type RamzKhidma =
  | "OPENAI"
  | "ANTHROPIC"
  | "OPENROUTER"
  | "BYNARA"
  | "X"
  | "META"
  | "LINKEDIN"
  | "TIKTOK"
  | "TELEGRAM";

// ── مزوّدات محرّك التوليد (العقل) ───────────────────────────
export type MuzawwidAql = "ANTHROPIC" | "OPENROUTER" | "BYNARA";

export interface WasfMuzawwid {
  ramz: MuzawwidAql;
  ism: string;
  ismLat: string;
  khidma: RamzKhidma; // خدمة المفتاح المطلوبة لهذا المزوّد
  namudhajIftiradi: string; // النموذج الافتراضي إن لم يُختر
  namadhijMuqtaraha: string[]; // نماذج مقترحة للاختيار السريع
}

/**
 * سجلّ المزوّدات — مصدر الحقيقة لخصائص كل مزوّد ونماذجه المقترحة.
 */
export const MUZAWWIDUN: Record<MuzawwidAql, WasfMuzawwid> = {
  ANTHROPIC: {
    ramz: "ANTHROPIC",
    ism: "Anthropic (Claude)",
    ismLat: "Anthropic",
    khidma: "ANTHROPIC",
    namudhajIftiradi: "claude-opus-4-8",
    namadhijMuqtaraha: [
      "claude-opus-4-8",
      "claude-sonnet-4-6",
      "claude-haiku-4-5-20251001",
    ],
  },
  OPENROUTER: {
    ramz: "OPENROUTER",
    ism: "OpenRouter",
    ismLat: "OpenRouter",
    khidma: "OPENROUTER",
    namudhajIftiradi: "google/gemini-2.0-flash-001",
    namadhijMuqtaraha: [
      "google/gemini-2.0-flash-001",
      "google/gemini-2.0-flash-lite-001",
      "google/gemma-3-27b-it",
      "meta-llama/llama-3.3-70b-instruct",
      "meta-llama/llama-3.1-8b-instruct",
      "mistralai/mistral-small-3.1-24b-instruct",
      "qwen/qwen-2.5-72b-instruct",
      "qwen/qwen-2.5-coder-32b-instruct",
      "nousresearch/hermes-3-llama-3.1-405b",
      "cognitivecomputations/dolphin-mixtral-8x22b",
      "deepseek/deepseek-chat",
      "openchat/openchat-8b",
      "microsoft/phi-3-medium-4k-instruct",
    ],
  },
  BYNARA: {
    ramz: "BYNARA",
    ism: "Bynara",
    ismLat: "Bynara",
    khidma: "BYNARA",
    namudhajIftiradi: "mistral-large",
    namadhijMuqtaraha: [
      "mistral-large",
      "mistral-medium-3-5",
      "claude-sonnet-4.5",
      "claude-haiku-4.5",
      "deepseek-3.2",
      "glm-5",
    ],
  },
};

export const KULL_MUZAWWIDUN = Object.values(MUZAWWIDUN);

// ── خطة النشر الشهرية ──────────────────────────────────────────
export interface KhitaShahri {
  /** عدد المنشورات في الشهر */
  adad: number;
  /** أوقات النشر المفضّلة (تنسيق HH:mm) */
  awqat: string[];
  /** أيام الأسبوع (1=الأحد … 7=السبت) — فارغ = كل الأيام */
  ayyam: number[];
}

// ── وصف منصّة تواصل (لواجهة العرض + قواعد النشر) ─────────────
export interface WasfManassa {
  ramz: RamzManassa;
  ism: string; // الاسم العربي
  ismLat: string; // الاسم اللاتيني
  lawn: string; // لون الهوية (hex)
  hadAqsa: number; // الحد الأقصى لعدد الأحرف
  yadamWasait: boolean; // هل يدعم الوسائط؟
}

/**
 * سجلّ المنصّات — مصدر الحقيقة الوحيد لخصائص كل منصّة.
 */
export const MANASSAT: Record<RamzManassa, WasfManassa> = {
  X: {
    ramz: "X",
    ism: "إكس",
    ismLat: "X (Twitter)",
    lawn: "#1d9bf0",
    hadAqsa: 280,
    yadamWasait: true,
  },
  LINKEDIN: {
    ramz: "LINKEDIN",
    ism: "لينكدإن",
    ismLat: "LinkedIn",
    lawn: "#0a66c2",
    hadAqsa: 3000,
    yadamWasait: true,
  },
  INSTAGRAM: {
    ramz: "INSTAGRAM",
    ism: "إنستغرام",
    ismLat: "Instagram",
    lawn: "#e1306c",
    hadAqsa: 2200,
    yadamWasait: true,
  },
  FACEBOOK: {
    ramz: "FACEBOOK",
    ism: "فيسبوك",
    ismLat: "Facebook",
    lawn: "#1877f2",
    hadAqsa: 63206,
    yadamWasait: true,
  },
  TIKTOK: {
    ramz: "TIKTOK",
    ism: "تيك توك",
    ismLat: "TikTok",
    lawn: "#ff0050",
    hadAqsa: 2200,
    yadamWasait: true,
  },
  TELEGRAM: {
    ramz: "TELEGRAM",
    ism: "تيليغرام",
    ismLat: "Telegram",
    lawn: "#229ed9",
    hadAqsa: 4096,
    yadamWasait: true,
  },
};

export const KULL_MANASSAT = Object.values(MANASSAT);

// ── شخصية الوكيل (تُخزَّن كـ JSON في حقل shakhsiyya) ─────────
export interface ShakhsiyyaWakeel {
  nabra: string; // النبرة (ملهمة، ودودة، رسمية...)
  uslub: string; // الأسلوب
  lugha: string; // اللغة/اللهجة
  rumuz: boolean; // استخدام الرموز التعبيرية؟
}

// ── نتيجة عملية نشر على منصّة ────────────────────────────────
export interface NatijatNashr {
  najah: boolean;
  maerifNashr?: string; // معرّف المنشور على المنصّة
  rabit?: string; // رابط المنشور
  khata?: string; // رسالة الخطأ إن فشل
}

// ── نتيجة اختبار اتصال مفتاح ─────────────────────────────────
export interface NatijatIkhtibar {
  najah: boolean;
  risala?: string; // رسالة توضيحية
  tafasil?: Record<string, unknown>;
}

// ── خصائص خدمة المفتاح (لواجهة خزنة المفاتيح) ───────────────
export interface WasfKhidma {
  ramz: RamzKhidma;
  ism: string;
  ismLat: string;
  lawn: string;
  tawdih: string; // أين يُستخدم هذا المفتاح
}

export const KHIDMAT: Record<RamzKhidma, WasfKhidma> = {
  OPENAI: {
    ramz: "OPENAI",
    ism: "OpenAI",
    ismLat: "OpenAI",
    lawn: "#10a37f",
    tawdih: "توليد محتوى نصّي بديل",
  },
  ANTHROPIC: {
    ramz: "ANTHROPIC",
    ism: "Anthropic (Claude)",
    ismLat: "Anthropic",
    lawn: "#d97757",
    tawdih: "محرّك العقل الأساسي لتوليد المحتوى",
  },
  OPENROUTER: {
    ramz: "OPENROUTER",
    ism: "OpenRouter",
    ismLat: "OpenRouter",
    lawn: "#6566f1",
    tawdih: "بوّابة نماذج متعدّدة للعقل — اختر النموذج لكل وكيل",
  },
  BYNARA: {
    ramz: "BYNARA",
    ism: "Bynara",
    ismLat: "Bynara",
    lawn: "#f59e0b",
    tawdih: "بوّابة نماذج OpenAI/Anthropic عبر naraya.ai",
  },
  X: {
    ramz: "X",
    ism: "إكس API",
    ismLat: "X API",
    lawn: "#1d9bf0",
    tawdih: "النشر التلقائي على إكس",
  },
  META: {
    ramz: "META",
    ism: "Meta Graph API",
    ismLat: "Meta",
    lawn: "#1877f2",
    tawdih: "النشر على إنستغرام وفيسبوك",
  },
  LINKEDIN: {
    ramz: "LINKEDIN",
    ism: "لينكدإن API",
    ismLat: "LinkedIn API",
    lawn: "#0a66c2",
    tawdih: "النشر المهني على لينكدإن",
  },
  TIKTOK: {
    ramz: "TIKTOK",
    ism: "تيك توك API",
    ismLat: "TikTok API",
    lawn: "#ff0050",
    tawdih: "نشر المحتوى على تيك توك",
  },
  TELEGRAM: {
    ramz: "TELEGRAM",
    ism: "تيليغرام بوت",
    ismLat: "Telegram Bot",
    lawn: "#229ed9",
    tawdih: "إدارة ونشر قناة تيليغرام عبر بوت (الصيغة: الرمز|@القناة)",
  },
};

export const KULL_KHIDMAT = Object.values(KHIDMAT);
