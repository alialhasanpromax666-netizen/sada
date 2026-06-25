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

// خريطة تحويل المواضيع العربية إلى بحث إنجليزي
const MAWAD_MAP: Record<string, string> = {
  كريبتو: "cryptocurrency bitcoin",
  بيتكوين: "bitcoin",
  افتراضي: "virtual reality",
  ذكاء_اصطناعي: "artificial intelligence",
  تقنية: "technology",
  أعمال: "business",
  تسويق: "marketing",
  مالية: "finance",
  ريادة: "startup",
  استثمار: "investment",
  أرقام: "statistics data",
  إحصاء: "statistics chart",
  مشاريع: "business project",
  نجاح: "success",
  تحدي: "challenge",
  مستقبل: "future",
  رقمي: "digital",
  تطوير: "development",
  برمجة: "programming",
  تجارة: "commerce",
  اقتصاد: "economy",
  سوق: "market",
  منصة: "platform",
  ربح: "profit",
  خسارة: "loss",
  مبيعات: "sales",
  عملاء: "customers",
  منتج: "product",
  خدمة: "service",
  جودة: "quality",
  ابتكار: "innovation",
};

function arabicToEnglishQuery(text: string): string {
  // البحث عن كلمات مفتاحية عربية واستبدالها
  for (const [ar, en] of Object.entries(MAWAD_MAP)) {
    if (text.includes(ar)) return en;
  }
  // إذا لم نجد شيئاً، نأخذ أول 3 كلمات إنجليزية
  const english = text.replace(/[^\w\s]/g, "").split(/\s+/).filter(w => /^[a-zA-Z]+$/.test(w)).slice(0, 3).join(" ");
  return english || "business technology";
}

interface ImageResult {
  buffer: Buffer;
  alt: string;
}

/**
 * يجلب صورة من Pexels حسب كلمة مفتاحية.
 */
export async function fetchFromPexels(
  query: string,
  apiKey: string,
): Promise<ImageResult | null> {
  try {
    // تحويل الكلمات العربية إلى بحث إنجليزي مناسب لـ Pexels
    const searchTerms = arabicToEnglishQuery(query);
    console.log("[fetchFromPexels] البحث:", searchTerms);

    const res = await fetch(
      `${PEXELS_API}?query=${encodeURIComponent(searchTerms)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: apiKey } },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      photos?: { src: { large2x: string }; alt: string }[];
    };
    const photo = data.photos?.[0];
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
