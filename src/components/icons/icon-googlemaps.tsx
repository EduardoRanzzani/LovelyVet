import { SVGProps } from 'react';

export function GoogleMapsIcon(props: SVGProps<SVGSVGElement>) {
	const gradientId = 'google-maps-gradient';
	return (
		<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 392' width='1em' height='1em' {...props}>
			<defs>
				<linearGradient id={gradientId} x1='0%' y1='0%' x2='100%' y2='100%'>
					<stop offset='0%' stopColor='#ea4335' />
					<stop offset='25%' stopColor='#fbbc04' />
					<stop offset='50%' stopColor='#34a853' />
					<stop offset='75%' stopColor='#4285f4' />
					<stop offset='100%' stopColor='#9b51e0' />
				</linearGradient>
			</defs>
			<path
				fill={`url(#${gradientId})`}
				d='M128 0C57.308 0 0 57.308 0 128c0 30.73 10.842 58.916 28.943 80.953L128 392l99.057-183.047C245.158 186.916 256 158.73 256 128c0-70.692-57.308-128-128-128zm0 188c-33.137 0-60-26.863-60-60s26.863-60 60-60s60 26.863 60 60s-26.863 60-60 60z'
			></path>
		</svg>
	);
}
