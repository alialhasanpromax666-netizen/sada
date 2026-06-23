import type { Config } from "tailwindcss";

/**
 * نظام صَدَى البصري — لوحة ألوان "الليل الرقمي":
 * خلفيات عميقة بنفسجية/كحلية مع توهّج فيروزي وذهبي.
 * مستوحاة من فكرة "الصدى" المتردّد عبر الفضاء الرقمي.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // قاع الليل
        layli: {
          900: "#0a0a14",
          800: "#10101f",
          700: "#171730",
          600: "#1f1f42",
        },
        // الصدى الفيروزي (اللون الأساسي للتفاعل)
        sada: {
          DEFAULT: "#2dd4bf",
          soft: "#5eead4",
          deep: "#0f766e",
        },
        // الوميض الذهبي (للتأكيدات والإنجازات)
        wameed: {
          DEFAULT: "#fbbf24",
          soft: "#fde68a",
        },
        // البنفسج (للوكلاء والذكاء)
        aql: {
          DEFAULT: "#a78bfa",
          deep: "#6d28d9",
        },
      },
      fontFamily: {
        // خط عربي/لاتيني موحّد يُحمّل من Google Fonts في layout
        sans: ["var(--font-cairo)", "system-ui", "sans-serif"],
        display: ["var(--font-tajawal)", "var(--font-cairo)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 24px -4px rgba(45, 212, 191, 0.45)",
        "glow-aql": "0 0 24px -4px rgba(167, 139, 250, 0.45)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at 50% 0%, rgba(45,212,191,0.08), transparent 60%)",
      },
      keyframes: {
        nabd: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        sariyan: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        // لمعان: وميض ينساب فوق الهياكل أثناء التحميل
        lamaan: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        // انزلاق الستار الجانبي للجوّال
        inzilaq: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        nabd: "nabd 2s ease-in-out infinite", // نبض
        sariyan: "sariyan 0.4s ease-out", // سريان (ظهور ناعم)
        lamaan: "lamaan 1.6s ease-in-out infinite", // لمعان (هياكل التحميل)
        inzilaq: "inzilaq 0.3s ease-out", // انزلاق (الستار الجانبي)
      },
    },
  },
  plugins: [],
};

export default config;
