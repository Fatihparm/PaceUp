import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/, // Sadece TS/JS dosyalarında çalışsın
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            icon: true, // SVG'yi otomatik olarak "icon" olarak işler
          },
        },
      ],
    });
    return config;
  },
};

export default nextConfig;
