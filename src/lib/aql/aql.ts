/**
 * ════════════════════════════════════════════════════════════
 *  العَقْل (Al-Aql) — محرّك توليد المحتوى الذكي
 * ════════════════════════════════════════════════════════════
 *
 * "العقل" هو الذكاء خلف كل وكيل في صَدَى. يأخذ شخصية الوكيل
 * وتخصّصه ومعرفته بالعمل والمنصّة المستهدفة، ثم يصوغ منشورات
 * أصيلة مُهيّأة لقيود كل منصّة.
 *
 * مزوّدان مدعومان لكل وكيل على حدة:
 *   - ANTHROPIC : عبر مكتبة Anthropic الرسمية (تفكير تكيّفي + مخرجات منظَّمة).
 *   - OPENROUTER: عبر واجهة متوافقة مع OpenAI (بوّابة نماذج متعدّدة).
 *
 * كما يدعم «الموضوع الذاتي»: حين لا يُمرَّر موضوع، يختار النموذج بنفسه
 * فكرة طازجة من مجال الوكيل ومعرفته — أساس النشر الذاتي للقناة.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
  MANASSAT,
  MUZAWWIDUN,
  type RamzManassa,
  type ShakhsiyyaWakeel,
  type MuzawwidAql,
} from "@/lib/types";

export interface TalabTawlid {
  /** اسم الوكيل وشخصيّته (تُشكّل صوته) */
  wakeel: {
    ism: string;
    wasf: string;
    takhassus: string;
    shakhsiyya: ShakhsiyyaWakeel;
    /** معرفة عن العمل/الشركة (Markdown) تُحقن كسياق مرجعي */
    maarifa?: string | null;
  };
  /** المنصّة المستهدفة (تحدّد الأسلوب والحد الأقصى) */
  manassa: RamzManassa;
  /** الموضوع أو الفكرة. اتركه فارغاً ليختار الوكيل موضوعاً بنفسه. */
  mawdu?: string;
  /** عدد المنشورات المطلوب توليدها (افتراضي 3) */
  adad?: number;
  /** مزوّد التوليد (افتراضي ANTHROPIC) */
  muzawwid?: MuzawwidAql;
  /** اسم النموذج (افتراضي: افتراضي المزوّد) */
  namudhaj?: string | null;
  /** مفتاح المزوّد (مفكوك التشفير؛ يُستخدم مفتاح البيئة لأنثروبيك إن غاب) */
  miftah?: string;
}

/** يحلّ النموذج الفعلي: المختار، وإلّا افتراضي المزوّد. */
function hallNamudhaj(muzawwid: MuzawwidAql, namudhaj?: string | null): string {
  if (namudhaj && namudhaj.trim()) return namudhaj.trim();
  return MUZAWWIDUN[muzawwid].namudhajIftiradi;
}

/**
 * يبني تعليمات النظام التي تُجسّد شخصية الوكيل ومعرفته.
 */
function bina2TaalimatNizam(talab: TalabTawlid): string {
  const { wakeel, manassa } = talab;
  const m = MANASSAT[manassa];
  const sh = wakeel.shakhsiyya;

  const sutur = [
    `أنت "${wakeel.ism}"، وكيل محتوى ذكي متخصّص في: ${wakeel.takhassus}.`,
    `مهمّتك: ${wakeel.wasf}`,
    ``,
    `صوتك وشخصيّتك:`,
    `- النبرة: ${sh.nabra}`,
    `- الأسلوب: ${sh.uslub}`,
    `- اللغة: ${sh.lugha}`,
    `- الرموز التعبيرية: ${sh.rumuz ? "استخدمها باعتدال حين تخدم المعنى" : "تجنّبها"}`,
    ``,
    `قواعد منصّة ${m.ism} (${m.ismLat}):`,
    `- الحد الأقصى الصارم: ${m.hadAqsa} حرفاً لكل منشور. لا تتجاوزه أبداً.`,
    manassa === "X"
      ? `- اجعل الجملة الأولى خطّافاً قوياً. الإيجاز سلاحك.`
      : manassa === "LINKEDIN"
        ? `- نبرة مهنية ملهمة، يُفضّل بنية من أسطر قصيرة قابلة للقراءة السريعة.`
        : manassa === "TELEGRAM"
          ? `- محتوى قناة مباشر وغنيّ بالقيمة، يصلح للقراءة المتسلسلة، بعنوان جاذب في أوّله.`
          : `- محتوى بصري الطابع وجذّاب يحفّز على الحفظ والمشاركة.`,
  ];

  // حقن معرفة العمل/الشركة كمرجع مُلزِم للحقائق.
  if (wakeel.maarifa && wakeel.maarifa.trim()) {
    sutur.push(
      ``,
      `معرفة مرجعية عن العمل/الشركة (التزم بها ولا تخالف حقائقها):`,
      `"""`,
      wakeel.maarifa.trim().slice(0, 6000),
      `"""`,
    );
  }

  sutur.push(
    ``,
    `اكتب محتوى أصيلاً لا يبدو آلياً. لا تستخدم عبارات مبتذلة. لا تكرّر الأفكار بين المنشورات.`,
  );

  return sutur.join("\n");
}

/** يبني رسالة المستخدم (مع دعم الموضوع الذاتي). */
function bina2TalabMustakhdim(talab: TalabTawlid, adad: number): string {
  const m = MANASSAT[talab.manassa];
  if (talab.mawdu && talab.mawdu.trim()) {
    return [
      `وَلِّد ${adad} منشورات مختلفة حول الموضوع التالي، كلٌّ منها مستقلّ وجاهز للنشر على ${m.ism}:`,
      ``,
      `الموضوع: ${talab.mawdu.trim()}`,
    ].join("\n");
  }
  // الموضوع الذاتي: يختار الوكيل أفكاراً بنفسه من مجاله ومعرفته.
  return [
    `اختر بنفسك ${adad} أفكاراً طازجة وقيّمة من مجال تخصّصك ومعرفتك المرجعية،`,
    `ثم وَلّد منشوراً مستقلّاً جاهزاً للنشر على ${m.ism} لكلّ فكرة.`,
    `تجنّب الموضوعات المكرّرة، وابدأ كلّ منشور بزاوية مختلفة.`,
  ].join("\n");
}

// مخطّط المخرجات المنظَّمة — يضمن استرجاع مصفوفة نصوص صالحة.
const MUKHATTAT_MUKHRAJAT = {
  type: "object" as const,
  properties: {
    manshurat: {
      type: "array" as const,
      items: { type: "string" as const },
    },
  },
  required: ["manshurat"],
  additionalProperties: false,
};

/** يقصّ النصوص على الحد الأقصى للمنصّة كطبقة أمان أخيرة. */
function hadDikat(manshurat: string[], hadAqsa: number): string[] {
  return manshurat.map((t) => (t.length > hadAqsa ? t.slice(0, hadAqsa) : t));
}

// ── مزوّد Anthropic ─────────────────────────────────────────
async function tawlidAnthropic(
  talab: TalabTawlid,
  adad: number,
  namudhaj: string,
): Promise<string[]> {
  const apiKey = talab.miftah ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "[صَدَى/العقل] لا يوجد مفتاح Anthropic. أضِف مفتاحاً في خزنة المفاتيح أو عرّف ANTHROPIC_API_KEY في البيئة.",
    );
  }
  const amil = new Anthropic({ apiKey });
  const m = MANASSAT[talab.manassa];

  // ملاحظة: نمرّر المعاملات كـ any لأن بعض إصدارات SDK لا تُعرّف بعد
  // أنواع التفكير التكيّفي والمخرجات المنظَّمة — لكنها صالحة وقت التشغيل.
  const params = {
    model: namudhaj,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    system: bina2TaalimatNizam(talab),
    output_config: {
      format: { type: "json_schema", schema: MUKHATTAT_MUKHRAJAT },
    },
    messages: [{ role: "user", content: bina2TalabMustakhdim(talab, adad) }],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const radd: any = await amil.messages.create(params as any);
  const kutla = (radd.content as Array<{ type: string; text?: string }>).find(
    (b) => b.type === "text" && b.text,
  );
  if (!kutla?.text) {
    throw new Error("[صَدَى/العقل] لم يُرجِع النموذج محتوى نصّياً.");
  }
  const mufakkak = JSON.parse(kutla.text) as { manshurat: string[] };
  return hadDikat(mufakkak.manshurat ?? [], m.hadAqsa);
}

// ── مزوّد OpenRouter (متوافق مع OpenAI) ─────────────────────
async function tawlidOpenRouter(
  talab: TalabTawlid,
  adad: number,
  namudhaj: string,
): Promise<string[]> {
  if (!talab.miftah) {
    throw new Error(
      "[صَدَى/العقل] لا يوجد مفتاح OpenRouter. أضِف مفتاحاً في خزنة المفاتيح.",
    );
  }
  const m = MANASSAT[talab.manassa];

  // نطلب JSON صريحاً عبر تعليمات النظام (response_format).
  const nizam =
    bina2TaalimatNizam(talab) +
    `\n\nأعِد ردّك حصراً ككائن JSON بالشكل: {"manshurat": ["...", "..."]} دون أي نصّ خارج JSON.`;

  const radd = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${talab.miftah}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Sada",
    },
    body: JSON.stringify({
      model: namudhaj,
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: nizam },
        { role: "user", content: bina2TalabMustakhdim(talab, adad) },
      ],
    }),
  });

  if (!radd.ok) {
    const tafsil = await radd.text().catch(() => "");
    throw new Error(
      `[صَدَى/العقل] فشل OpenRouter (HTTP ${radd.status}). ${tafsil.slice(0, 200)}`,
    );
  }

  const data = (await radd.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const matn = data.choices?.[0]?.message?.content;
  if (!matn) {
    throw new Error("[صَدَى/العقل] لم يُرجِع OpenRouter محتوى.");
  }

  let mufakkak: { manshurat?: string[] };
  try {
    mufakkak = JSON.parse(matn) as { manshurat?: string[] };
  } catch {
    // بعض النماذج تُغلّف JSON بكتلة ```؛ نستخرج أوّل كائن.
    const m2 = matn.match(/\{[\s\S]*\}/);
    mufakkak = m2 ? (JSON.parse(m2[0]) as { manshurat?: string[] }) : {};
  }
  return hadDikat(mufakkak.manshurat ?? [], m.hadAqsa);
}

// ── مزوّد Bynara (OpenAI-compatible عبر router.bynara.id) ───
async function tawlidBynara(
  talab: TalabTawlid,
  adad: number,
  namudhaj: string,
): Promise<string[]> {
  if (!talab.miftah) {
    throw new Error(
      "[صَدَى/العقل] لا يوجد مفتاح Bynara. أضِف مفتاحاً في خزنة المفاتيح.",
    );
  }
  const m = MANASSAT[talab.manassa];

  const nizam =
    bina2TaalimatNizam(talab) +
    `\n\nأعِد ردّك حصراً ككائن JSON بالشكل: {"manshurat": ["...", "..."]} دون أي نصّ خارج JSON.`;

  const radd = await fetch("https://router.bynara.id/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${talab.miftah}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: namudhaj,
      max_tokens: 4000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: nizam },
        { role: "user", content: bina2TalabMustakhdim(talab, adad) },
      ],
    }),
  });

  if (!radd.ok) {
    const tafsil = await radd.text().catch(() => "");
    throw new Error(
      `[صَدَى/العقل] فشل Bynara (HTTP ${radd.status}). ${tafsil.slice(0, 200)}`,
    );
  }

  const data = (await radd.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const matn = data.choices?.[0]?.message?.content;
  if (!matn) {
    throw new Error("[صَدَى/العقل] لم يُرجِع Bynara محتوى.");
  }

  let mufakkak: { manshurat?: string[] };
  try {
    mufakkak = JSON.parse(matn) as { manshurat?: string[] };
  } catch {
    const m2 = matn.match(/\{[\s\S]*\}/);
    mufakkak = m2 ? (JSON.parse(m2[0]) as { manshurat?: string[] }) : {};
  }
  return hadDikat(mufakkak.manshurat ?? [], m.hadAqsa);
}

/**
 * تَوْلِيد (Generate): يصوغ مجموعة منشورات بصوت الوكيل للمنصّة المحدّدة
 * عبر مزوّده ونموذجه المختارين.
 */
export async function tawlidMuhtawa(talab: TalabTawlid): Promise<string[]> {
  const adad = Math.min(Math.max(talab.adad ?? 3, 1), 8);
  const muzawwid: MuzawwidAql = talab.muzawwid ?? "ANTHROPIC";
  const namudhaj = hallNamudhaj(muzawwid, talab.namudhaj);

  if (muzawwid === "OPENROUTER") {
    return tawlidOpenRouter(talab, adad, namudhaj);
  }
  if (muzawwid === "BYNARA") {
    return tawlidBynara(talab, adad, namudhaj);
  }
  return tawlidAnthropic(talab, adad, namudhaj);
}

/**
 * تَنْقِيح (Refine): يعيد صياغة منشور قائم وفق توجيه (أقصر/أقوى/نبرة مختلفة).
 * يستخدم مزوّد Anthropic (التنقيح السريع).
 */
export async function tanqihMuhtawa(
  matnAsli: string,
  tawjih: string,
  manassa: RamzManassa,
  miftah?: string,
): Promise<string> {
  const apiKey = miftah ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return matnAsli;
  const amil = new Anthropic({ apiKey });
  const m = MANASSAT[manassa];

  const params = {
    model: process.env.SADA_AQL_MODEL ?? "claude-opus-4-8",
    max_tokens: 2000,
    thinking: { type: "adaptive" },
    system: `أنت محرّر محتوى خبير لمنصّة ${m.ism}. الحد الأقصى ${m.hadAqsa} حرفاً.`,
    messages: [
      {
        role: "user",
        content: `أعد صياغة المنشور التالي وفق التوجيه: "${tawjih}".\n\nالمنشور:\n${matnAsli}\n\nأعطني النص الجديد فقط دون مقدّمات.`,
      },
    ],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const radd: any = await amil.messages.create(params as any);
  const kutla = (radd.content as Array<{ type: string; text?: string }>).find(
    (b) => b.type === "text" && b.text,
  );
  const natija = kutla?.text ? kutla.text.trim() : matnAsli;
  return natija.length > m.hadAqsa ? natija.slice(0, m.hadAqsa) : natija;
}
