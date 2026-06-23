/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // صَدَى تعتمد وحدات خادمية (Node crypto + Prisma) في طبقة الـ API فقط.
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@anthropic-ai/sdk"],
  },
  // يسمح لـ recharts/d3 باستخدام new Function() داخل المتصفح
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline' https:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
