/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // صَدَى تعتمد وحدات خادمية (Node crypto + Prisma) في طبقة الـ API فقط.
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "@anthropic-ai/sdk"],
  },
};

export default nextConfig;
