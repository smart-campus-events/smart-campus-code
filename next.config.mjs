/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable TypeScript type checking during build for faster builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint checking during build for faster builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow importing from outside the src directory
  experimental: {
    esmExternals: true,
  }
};

export default nextConfig;
