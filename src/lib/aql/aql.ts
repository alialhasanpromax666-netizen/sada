/**
 * ════════════════════════════════════════════════════════════
 *  العَقْل (Al-Aql) — محرّك توليد المحتوى الذكي
 * ════════════════════════════════════════════════════════════
 *
 * "العقل" هو الذكاء خلف كل وكيل في صَدَى.
 *
 * مزوّدان مدعومان لكل وكيل على حدة:
 *   - BYNARA    : بوابة نماذج عبر naraya.ai
 *   - OPENROUTER: عبر واجهة متوافقة مع OpenAI.
 */
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
  /** مزوّد التوليد (افتراضي BYNARA) */
  muzawwid?: MuzawwidAql;
  /** اسم النموذج (افتراضي: افتراضي المزوّد) */
  namudhaj?: string | null;
  /** مفتاح المزوّد (مفكوك التشفير) */
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
    `اكتب محتوى أصيلاً لا يبدو آلياً. لا تستخدم عبارات مبتذلة.`,
    ``,
    `قاعدة التنوّع الصارمة — كل منشور يجب أن يكون مختلفاً جذرياً عن الآخرين:`,
    `- افتتاحيات مختلفة: سؤال، صدمة، قصة، إحصاء، اقتباس، تحدي — لا تتكرر.`,
    `- بنى مختلفة: سرد / لائحة / سؤال وجواب / تحليل / مقارنة / نصائح سريعة.`,
    `- زوايا مختلفة: مشكلة → حل، رأي، اكتشاف، نقد، فضفضة، فرصة.`,
    `- لا تبدأ منشورين بنفس الأسلوب ولا تتشابه الجمل الأولى أبداً.`,
  );

  return sutur.join("\n");
}

/** يبني رسالة المستخدم (مع دعم الموضوع الذاتي). */
function bina2TalabMustakhdim(talab: TalabTawlid, adad: number): string {
  const m = MANASSAT[talab.manassa];
  if (talab.mawdu && talab.mawdu.trim()) {
    return [
      `وَلِّد ${adad} منشورات حول الموضوع التالي، كلّ منها مختلف عن الآخر في البنية والزاوية:`,
      ``,
      `الموضوع: ${talab.mawdu.trim()}`,
      ``,
      `أعطني ${adad} زوايا مختلفة تماماً: مثلاً (تحليل + قصة + لائحة + رأي + إحصاء)،`,
      `ولا تجعل افتتاحية أي منشور تشبه افتتاحية الآخر.`,
    ].join("\n");
  }
  // الموضوع الذاتي: يختار الوكيل أفكاراً بنفسه من مجاله ومعرفته.
  return [
    `اختر بنفسك ${adad} أفكاراً مختلفة جذرياً من مجال تخصّصك ومعرفتك المرجعية،`,
    `ثم وَلّد لكل فكرة منشوراً مستقلّاً وجاهزاً للنشر على ${m.ism}.`,
    `تأكّد أن كل منشور يختلف عن الآخر في: البنية، الزاوية، الافتتاحية، الطول التقريبي،`,
    `والأسلوب. لا تكرّر نفس البنية أو نفس نمط الافتتاحية في منشورين متتاليين.`,
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

/**
 * يعالج نصوص JSON الصادرة من النماذج ويصحّح escapes غير الصالحة
 * قبل تمريرها إلى JSON.parse.
 */
function sannahMatnJson(raw: string): string {
  // استخراج أول كائن JSON (بعض النماذج تغلفه بـ ```)
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return raw;
  let json = m[0];
  // إصلاح escapes غير صالحة: \x → \\x, \a → \\a إلخ
  json = json.replace(/\\([^"\\/bfnrtu])/g, "\\\\$1");
  return json;
}

/** يحاول تحليل JSON ويُعيد المصفوفة أو مصفوفة فارغة. */
function hallMatnJson(matn: string): string[] {
  const nazif = sannahMatnJson(matn);
  try {
    const mufakkak = JSON.parse(nazif) as { manshurat?: string[] };
    return mufakkak.manshurat ?? [];
  } catch {
    // محاولة أخيرة: استخراج النصوص داخل المصفوفة مباشرة
    const bad = matn.match(/"manshurat"\s*:\s*\[([\s\S]*?)\]/);
    if (bad) {
      const kusul: string[] = [];
      for (const q of bad[1].match(/"((?:[^"\\]|\\.)*)"/g) ?? []) {
        try {
          kusul.push(JSON.parse(q));
        } catch {
          kusul.push(q.replace(/^"|"$/g, ""));
        }
      }
      return kusul;
    }
    return [];
  }
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

  const manshurat = hallMatnJson(matn);
  return hadDikat(manshurat, m.hadAqsa);
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

  const manshurat = hallMatnJson(matn);
  return hadDikat(manshurat, m.hadAqsa);
}

/**
 * تَوْلِيد (Generate): يصوغ مجموعة منشورات بصوت الوكيل للمنصّة المحدّدة
 * عبر مزوّده ونموذجه المختارين.
 */
export async function tawlidMuhtawa(talab: TalabTawlid): Promise<string[]> {
  const adad = Math.min(Math.max(talab.adad ?? 3, 1), 8);
  const muzawwid: MuzawwidAql =
    talab.muzawwid === "OPENROUTER" ? "OPENROUTER" : "BYNARA";
  const namudhaj = hallNamudhaj(muzawwid, talab.namudhaj);

  if (muzawwid === "OPENROUTER") {
    return tawlidOpenRouter(talab, adad, namudhaj);
  }
  return tawlidBynara(talab, adad, namudhaj);
}

/**
 * تَنْقِيح (Refine): يعيد صياغة منشور قائم وفق توجيه (أقصر/أقوى/نبرة مختلفة).
 */
export async function tanqihMuhtawa(
  matnAsli: string,
  tawjih: string,
  manassa: RamzManassa,
  miftah?: string,
): Promise<string> {
  if (!miftah) return matnAsli;
  const m = MANASSAT[manassa];

  const radd = await fetch("https://router.bynara.id/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${miftah}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-medium-3-5",
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `أنت محرّر محتوى خبير لمنصّة ${m.ism}. الحد الأقصى ${m.hadAqsa} حرفاً.`,
        },
        {
          role: "user",
          content: `أعد صياغة المنشور التالي وفق التوجيه: "${tawjih}".\n\nالمنشور:\n${matnAsli}\n\nأعطني النص الجديد فقط دون مقدّمات.`,
        },
      ],
    }),
  });

  if (!radd.ok) return matnAsli;

  const data = (await radd.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const natija = data.choices?.[0]?.message?.content?.trim() ?? matnAsli;
  return natija.length > m.hadAqsa ? natija.slice(0, m.hadAqsa) : natija;
}
