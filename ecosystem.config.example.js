module.exports = {
	apps: [
		{
			name: "lovelyvet",
			script: "./node_modules/next/dist/bin/next",
			args: "start",
			max_memory_restart: "2048M",
			node_args: "--max-old-space-size=2048 --max-semi-space-size=128",
			cwd: "/root/projects/lovely-vet",
			env_file: ".env",
			env: {
				NODE_ENV: "production",
				NODE_OPTIONS: "--max-old-space-size=2048 --max-semi-space-size=128",
				PORT: 3000,
				NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "",
				CLERK_SECRET_KEY: "",
				CLERK_WEBHOOK_SECRET: "",
				NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
				NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: "/dashboard",
				NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
				NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: "/dashboard",
				DATABASE_URL: "",
				NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: "lovelyvet",
				NEXT_PUBLIC_CLOUDINARY_API_KEY: "",
				NEXT_PUBLIC_CLOUDINARY_API_SECRET: "",
				EMAIL_USER: "",
				EMAIL_PASS: "",
				EVOLUTION_API_KEY: ""
			},
		}
	]
}
