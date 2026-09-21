import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	reactCompiler: true,
	reactStrictMode: false,
	images: {
		remotePatterns: [
			{ hostname: 'ui-avatars.com' },
			{
				hostname: 'res.cloudinary.com',
			},
			{
				hostname: 'img.clerk.com',
			},
		],
	},
	experimental: {
		serverActions: {
			bodySizeLimit: '5mb',
		},
	},
	allowedDevOrigins: ['192.168.1.192'],
};

export default nextConfig;
