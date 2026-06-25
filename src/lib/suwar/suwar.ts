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
  // كريبتو وعملات رقمية
  كريبتو: "bitcoin cryptocurrency chart",
  بيتكوين: "bitcoin crypto coin",
  عملة: "digital currency coin",
  عملات: "cryptocurrency exchange",
  رقمية: "digital technology",
  بلوكشين: "blockchain network",
  decentralized: "decentralized network",
  
  // ذكاء اصطناعي
  ذكاء_اصطناعي: "artificial intelligence robot",
  ذكاء: "smart technology",
  ai: "artificial intelligence",
  روبوت: "robot automation",
  آلي: "automation machine",
  
  // تقنية وبرمجة
  تقنية: "technology computer screen",
  برمجة: "code programming screen",
  كود: "coding screen developer",
  تطوير: "software development",
  تطبيق: "mobile app interface",
  منصة: "platform dashboard",
  واجهة: "user interface design",
  تصميم: "design technology",
  
  // بيانات وأمن
  بيانات: "big data server",
  سحابي: "cloud computing server",
  أمن: "cybersecurity shield",
  شبكة: "network server room",
  سيرفر: "server room data",
  
  // أعمال ومالية
  أعمال: "business analytics laptop",
  مالية: "financial chart graph",
  استثمار: "investment growth chart",
  أرقام: "data analytics dashboard",
  إحصاء: "statistics chart graph",
  ربح: "profit growth chart",
  مبيعات: "sales analytics chart",
  تسويق: "digital marketing screen",
  اقتصاد: "economy market data",
  سوق: "stock market graph",
  
  // مشاريع وريادة
  مشاريع: "startup technology office",
  ريادة: "entrepreneurship innovation",
  نجاح: "success growth chart",
  ابتكار: "innovation technology",
  
  // أجهزة
  هاتف: "smartphone technology",
  لابتوب: "laptop computer",
  جهاز: "tech device gadget",
  
  // مخططات ورسوم
  رسم: "data visualization chart",
  مخطط: "flowchart diagram",
  بيان: "chart presentation",
  مؤشر: "metrics dashboard analytics",
  تحليل: "data analysis screen",
};

// كلمات مفتاحية تقنية افتراضية
const TECH_DEFAULTS = [
  "technology abstract blue",
  "digital network nodes",
  "data visualization dark",
  "futuristic tech interface",
  "code programming dark",
  "server room blue light",
  "artificial intelligence brain",
  "cybersecurity digital lock",
];

function arabicToEnglishQuery(text: string): string {
  // البحث عن كلمات مفتاحية عربية واستبدالها
  const lowerText = text.toLowerCase();
  for (const [ar, en] of Object.entries(MAWAD_MAP)) {
    if (lowerText.includes(ar)) {
      console.log(`[arabicToEnglishQuery] وجدت "${ar}" → "${en}"`);
      return en;
    }
  }
  // اختيار عشوائي من التقنيات الافتراضية
  const defaultQuery = TECH_DEFAULTS[Math.floor(Math.random() * TECH_DEFAULTS.length)];
  console.log(`[arabicToEnglishQuery] لا توجد كلمة مفتاحية، استخدام افتراضي: "${defaultQuery}"`);
  return defaultQuery;
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
    // لا نضيف كلمات إضافية - البحث الأصلي كافٍ
    console.log("[fetchFromPexels] البحث:", searchTerms);

    const res = await fetch(
      `${PEXELS_API}?query=${encodeURIComponent(searchTerms)}&per_page=15&orientation=landscape&size=large`,
      { headers: { Authorization: apiKey } },
    );
    if (!res.ok) {
      console.log("[fetchFromPexels] خطأ HTTP:", res.status);
      return null;
    }

    const data = (await res.json()) as {
      photos?: { src: { large2x: string }; alt: string }[];
    };
    
    console.log(`[fetchFromPexels] وجدت ${data.photos?.length ?? 0} صور`);
    
    // تصفية الصور التي قد تحتوي أشخاصاً أو طبيعة
    const photos = data.photos?.filter(photo => {
      const alt = (photo.alt ?? "").toLowerCase();
      // استبعاد صور الأشخاص
      if (alt.includes("person") || alt.includes("people") || 
          alt.includes("man") || alt.includes("woman") || 
          alt.includes("face") || alt.includes("portrait") ||
          alt.includes("child") || alt.includes("group") ||
          alt.includes("boy") || alt.includes("girl") ||
          alt.includes("male") || alt.includes("female")) {
        return false;
      }
      // استبعاد صور الطبيعة
      if (alt.includes("nature") || alt.includes("forest") || 
          alt.includes("mountain") || alt.includes("ocean") ||
          alt.includes("beach") || alt.includes("sky") ||
          alt.includes("tree") || alt.includes("flower") ||
          alt.includes("animal") || alt.includes("dog") ||
          alt.includes("cat") || alt.includes("bird")) {
        return false;
      }
      return true;
    }) ?? [];
    
    console.log(`[fetchFromPexels] بعد التصفية: ${photos.length} صور`);
    
    const photo = photos[0] ?? data.photos?.[0];
    if (!photo) {
      console.log("[fetchFromPexels] لا توجد صور مناسبة");
      return null;
    }

    console.log("[fetchFromPexels] الصورة المختارة:", photo.alt);
    const imgRes = await fetch(photo.src.large2x);
    if (!imgRes.ok) return null;

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    return { buffer, alt: photo.alt ?? query };
  } catch (e) {
    console.error("[fetchFromPexels] خطأ:", e);
    return null;
  }
}

/**
 * ينشئ الإطار الأزرق — خلفية سوداء + نصوص في الأسفل.
 */
export async function applyFrame(
  options?: { url?: string; channel?: string },
): Promise<Buffer> {
  const url = options?.url ?? "https://sada.app";
  const channel = options?.channel ?? "@sada_app";

  // بناء الإطار كـ SVG — خلفية سوداء بالكامل مع نصوص أسفل
  const svgFrame = `<svg width="${IMAGE_SIZE}" height="${IMAGE_SIZE}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${IMAGE_SIZE}" y2="${IMAGE_SIZE}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0055ff"/>
      <stop offset="100%" stop-color="#001133"/>
    </linearGradient>
  </defs>
  <!-- خلفية الإطار الزرقاء -->
  <rect width="${IMAGE_SIZE}" height="${IMAGE_SIZE}" fill="url(#bg)"/>
  <!-- المربع الأسود الداخلي -->
  <rect x="${FRAME_WIDTH}" y="${FRAME_WIDTH}" width="${IMAGE_SIZE - FRAME_WIDTH * 2}" height="${IMAGE_SIZE - FRAME_WIDTH * 2}" fill="#000000"/>
  <!-- أيقونة المونيتور -->
  <rect x="${FRAME_WIDTH + 20}" y="${IMAGE_SIZE - 65}" width="24" height="18" rx="2" fill="none" stroke="${TEXT_COLOR}" stroke-width="2"/>
  <line x1="${FRAME_WIDTH + 20}" y1="${IMAGE_SIZE - 43}" x2="${FRAME_WIDTH + 44}" y2="${IMAGE_SIZE - 43}" stroke="${TEXT_COLOR}" stroke-width="2"/>
  <line x1="${FRAME_WIDTH + 32}" y1="${IMAGE_SIZE - 43}" x2="${FRAME_WIDTH + 32}" y2="${IMAGE_SIZE - 38}" stroke="${TEXT_COLOR}" stroke-width="2"/>
  <!-- رابط الموقع -->
  <text x="${FRAME_WIDTH + 52}" y="${IMAGE_SIZE - 50}" fill="${TEXT_COLOR}" font-family="Arial,sans-serif" font-size="16" font-weight="bold">${url}</text>
  <!-- أيقونة تيليغرام -->
  <circle cx="${FRAME_WIDTH + 32}" cy="${IMAGE_SIZE - 25}" r="12" fill="none" stroke="${TEXT_COLOR}" stroke-width="2"/>
  <path d="M${FRAME_WIDTH + 26} ${IMAGE_SIZE - 25} l4 2 l8 -4 l-1 8 l-5 -2 l-3 2 l-1 -3 l5 -2 z" fill="${TEXT_COLOR}"/>
  <!-- حساب تيليغرام -->
  <text x="${FRAME_WIDTH + 52}" y="${IMAGE_SIZE - 21}" fill="${TEXT_COLOR}" font-family="Arial,sans-serif" font-size="16" font-weight="bold">${channel}</text>
</svg>`;

  // إنشاء الصورة من SVG مباشرة
  const result = await sharp(Buffer.from(svgFrame))
    .png()
    .toBuffer();

  return result;
}

/**
 * ينشئ صورة الإطار (بدون صورة من Pexels).
 */
export async function createFrameImage(
  options?: { url?: string; channel?: string },
): Promise<Buffer> {
  return applyFrame(options);
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
