import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { SessionWrapper } from "@/components/SessionWrapper";
import { Shell } from "@/components/Shell";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "صَدَى — منصّة وكلاء النشر الذكي",
  description:
    "صَدَى: أنشئ وكلاء ذكاء اصطناعي مستقلّين ينشرون نيابةً عنك على منصّات التواصل، بجدولة ذكية وتحليل أداء.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <body>
        <SessionWrapper>
          <Shell>{children}</Shell>
        </SessionWrapper>
      </body>
    </html>
  );
}
