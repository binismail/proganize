/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "i.pravatar.cc",
      "avatars.githubusercontent.com",
      "images.unsplash.com"
    ],
  },
  webpack: (config, { isServer }) => {
    // Add handling for PDF.js worker
    config.resolve.alias.pdfjs = 'pdfjs-dist/legacy/build/pdf';

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        stream: false,
        path: false
      };
    }

    return config;
  }
};

module.exports = nextConfig;
