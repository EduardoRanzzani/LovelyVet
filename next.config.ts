import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				source: '/receitas/validar/:path*',
				headers: [
					{ key: 'Referrer-Policy', value: 'no-referrer' },
					{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
				],
			},
		];
	},
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
