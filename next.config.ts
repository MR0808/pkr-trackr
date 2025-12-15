import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // Exclude Prisma from Edge Runtime (moved from experimental in Next.js 16)
    serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg'],
    // Add empty turbopack config to silence the warning
    turbopack: {},
    experimental: {
        serverActions: {
            bodySizeLimit: '5mb'
        }
    }
};

export default nextConfig;
