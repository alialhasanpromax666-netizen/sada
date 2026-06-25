/**
 * ════════════════════════════════════════════════════════════
 *  معالج الصور — جلب من Pexels + إضافة الإطار الأزرق
 * ════════════════════════════════════════════════════════════
 */
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

const PEXELS_API = "https://api.pexels.com/v1/search";
const FRAME_WIDTH = 40;
const IMAGE_SIZE = 1080;
const TEXT_AREA_HEIGHT = 100;

// ألوان الإطار
const FRAME_COLOR_TOP = "#0066ff";
const FRAME_COLOR_BOTTOM = "#003399";
const TEXT_COLOR = "#00aaff";

// خريطة تحويل المواضيع العربية إلى بحث إنجليزي - صور تقنية فقط
const MAWAD_MAP: Record<string, string> = {
  كريبتو: "blockchain digital currency",
  بيتكوين: "bitcoin crypto",
  افتراضي: "virtual reality headset",
  ذكاء_اصطناعي: "artificial intelligence robot",
  تقنية: "technology computer",
  أعمال: "business laptop",
  تسويق: "digital marketing analytics",
  مالية: "financial charts data",
  ريادة: "startup office",
  استثمار: "investment graph",
  أرقام: "data analytics dashboard",
  إحصاء: "statistics chart graph",
  مشاريع: "business technology",
  نجاح: "success growth chart",
  تحدي: "challenge innovation",
  مستقبل: "future technology",
  رقمي: "digital transformation",
  تطوير: "software development",
  برمجة: "coding programming",
  تجارة: "e-commerce digital",
  اقتصاد: "economy data",
  سوق: "stock market data",
  منصة: "platform technology",
  ربح: "profit growth",
  خسارة: "loss decline",
  مبيعات: "sales analytics",
  عملاء: "customer data",
  منتج: "product technology",
  خدمة: "digital service",
  جودة: "quality control",
  ابتكار: "innovation tech",
  ذكاء: "smart technology",
  روبوت: "robot automation",
  بيانات: "big data server",
  سحابي: "cloud computing",
  أمن: "cybersecurity",
  شبكة: "network server",
  هاتف: "smartphone mobile",
  تطبيق: "app interface",
  واجهة: "user interface design",
  تصميم: "design technology",
  إبداع: "creative technology",
  أداة: "tech tools",
  مبتكر: "innovative gadget",
  حديث: "modern technology",
  متقدم: "advanced technology",
  عصري: "contemporary tech",
  سريع: "fast speed technology",
  قوي: "powerful technology",
  ذكي: "smart device",
  تحليل: "data analysis",
  رسم: "data visualization",
  مخطط: "flowchart diagram",
  بيان: "chart presentation",
  مؤشر: "metrics dashboard",
};

// كلمات مفتاحية تقنية للبحث当لا يوجد تطابق
const TECH_DEFAULTS = [
  "technology abstract",
  "digital network",
  "data visualization",
  "cyberpunk technology",
  "futuristic tech",
  "code programming",
  "server room",
  "artificial intelligence",
];

function arabicToEnglishQuery(text: string): string {
  // البحث عن كلمات مفتاحية عربية واستبدالها
  for (const [ar, en] of Object.entries(MAWAD_MAP)) {
    if (text.includes(ar)) return en;
  }
  // اختيار عشوائي من التقنيات الافتراضية
  return TECH_DEFAULTS[Math.floor(Math.random() * TECH_DEFAULTS.length)];
}

interface ImageResult {
  buffer: Buffer;
  alt: string;
}

/**
 * يجلب صورة من Pexels حسب كلمة مفتاحية — صور تقنية فقط.
 */
export async function fetchFromPexels(
  query: string,
  apiKey: string,
): Promise<ImageResult | null> {
  try {
    // تحويل الكلمات العربية إلى بحث إنجليزي مناسب لـ Pexels
    const searchTerms = arabicToEnglishQuery(query);
    // إضافة كلمات لاستبعاد الأشخاص
    const fullQuery = `${searchTerms} abstract minimalist`;
    console.log("[fetchFromPexels] البحث:", fullQuery);

    const res = await fetch(
      `${PEXELS_API}?query=${encodeURIComponent(fullQuery)}&per_page=10&orientation=landscape`,
      { headers: { Authorization: apiKey } },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      photos?: { src: { large2x: string }; alt: string }[];
    };
    
    // تصفية الصور التي قد تحتوي أشخاصاً
    const photos = data.photos?.filter(photo => {
      const alt = (photo.alt ?? "").toLowerCase();
      return !alt.includes("person") && 
             !alt.includes("people") && 
             !alt.includes("man") && 
             !alt.includes("woman") && 
             !alt.includes("face") &&
             !alt.includes("portrait") &&
             !alt.includes("child") &&
             !alt.includes("group");
    }) ?? [];
    
    const photo = photos[0] ?? data.photos?.[0];
    if (!photo) return null;

    const imgRes = await fetch(photo.src.large2x);
    if (!imgRes.ok) return null;

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    return { buffer, alt: photo.alt ?? query };
  } catch {
    return null;
  }
}

/**
 * ينشئ الإطار الأزرق ويضع الصورة في وسطه.
 */
export async function applyFrame(
  imageBuffer: Buffer,
  options?: { url?: string; channel?: string },
): Promise<Buffer> {
  const url = options?.url ?? "sada.app";
  const channel = options?.channel ?? "@sada_app";

  // بناء الإطار كـ SVG
  const svgFrame = `<svg width="${IMAGE_SIZE}" height="${IMAGE_SIZE}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${FRAME_COLOR_TOP}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${FRAME_COLOR_BOTTOM}" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <rect width="${IMAGE_SIZE}" height="${IMAGE_SIZE}" fill="#000000"/>
    <rect width="${IMAGE_SIZE}" height="${IMAGE_SIZE}" fill="none" stroke="url(#frameGrad)" stroke-width="${FRAME_WIDTH}"/>
    <text x="${FRAME_WIDTH + 20}" y="${IMAGE_SIZE - 30}" fill="${TEXT_COLOR}" font-family="Arial,sans-serif" font-size="18" font-weight="bold">${url}</text>
    <text x="${FRAME_WIDTH + 20}" y="${IMAGE_SIZE - 8}" fill="${TEXT_COLOR}" font-family="Arial,sans-serif" font-size="18" font-weight="bold">${channel}</text>
  </svg>`;

  // حجم المنطقة المتاحة للصورة
  const regionWidth = IMAGE_SIZE - FRAME_WIDTH * 2;
  const regionHeight = IMAGE_SIZE - FRAME_WIDTH * 2 - TEXT_AREA_HEIGHT;

  // تجهيز الصورة الأصلية
  const resized = await sharp(imageBuffer)
    .resize(regionWidth, regionHeight, { fit: "cover", position: "center" })
    .toBuffer();

  // دمج الصورة مع الإطار
  const result = await sharp(Buffer.from(svgFrame))
    .composite([
      {
        input: resized,
        left: FRAME_WIDTH,
        top: FRAME_WIDTH,
      },
    ])
    .png()
    .toBuffer();

  return result;
}

/**
 * يجلب صورة من Pexels ويضع عليها الإطار.
 */
export async function preparePostImage(
  query: string,
  pexelsApiKey: string,
  options?: { url?: string; channel?: string },
): Promise<Buffer | null> {
  const img = await fetchFromPexels(query, pexelsApiKey);
  if (!img) return null;

  return applyFrame(img.buffer, options);
}

/**
 * يحفظ صورة — على Vercel يرجع data URL، محلياً يحفظ في public/suwar/
 */
export async function saveImage(
  buffer: Buffer,
  prefix: string,
): Promise<string> {
  // على Vercel (Serverless) — نرجع base64
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return `data:image/png;base64,${buffer.toString("base64")}`;
  }

  // محلياً — نحفظ في public/suwar/
  const dir = path.join(process.cwd(), "public", "suwar");
  await fs.mkdir(dir, { recursive: true });

  const filename = `${prefix}-${Date.now()}.png`;
  const filepath = path.join(dir, filename);
  await fs.writeFile(filepath, buffer);

  return `/suwar/${filename}`;
}
