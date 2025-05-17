
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https', // Assuming your MinIO is served over HTTPS
        hostname: 'minio.giancarlojunior.com',
        port: '', // Or specify port if it's non-standard for HTTPS (e.g., if not 443)
        pathname: '/**', // Allow any path from this host
      },
    ],
  },
};

export default nextConfig;
