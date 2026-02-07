/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Transpile shared package
  transpilePackages: ['@bettermind/shared'],
  
  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  
  // Image optimization configuration
  images: {
    domains: ['lh3.googleusercontent.com'], // Google profile images
  },
};

module.exports = nextConfig;
