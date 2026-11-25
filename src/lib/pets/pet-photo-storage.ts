import { randomUUID } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';

function configureCloudinary() {
	const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
	const apiKey = process.env.CLOUDINARY_API_KEY;
	const apiSecret = process.env.CLOUDINARY_API_SECRET;
	if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary não configurado');
	cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
}

export async function uploadTutorPetPhoto(bytes: Uint8Array): Promise<{ url: string; publicId: string }> {
	configureCloudinary();
	const publicId = `pets/tutor-photos/${randomUUID()}`;
	return new Promise((resolve, reject) => {
		cloudinary.uploader.upload_stream({
			public_id: publicId,
			overwrite: false,
			resource_type: 'image',
			allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
			transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
		}, (error, result) => {
			if (error || !result?.secure_url) return reject(new Error('Falha no upload da foto'));
			resolve({ url: result.secure_url, publicId });
		}).end(Buffer.from(bytes));
	});
}

// Exclusivamente para um upload recém-criado que comprovadamente não foi associado.
export async function discardUnattachedTutorPhoto(publicId: string): Promise<void> {
	if (!/^pets\/tutor-photos\/[0-9a-f-]{36}$/.test(publicId)) return;
	try {
		configureCloudinary();
		await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
	} catch {
		console.error('Não foi possível descartar um upload de foto não associado.');
	}
}
