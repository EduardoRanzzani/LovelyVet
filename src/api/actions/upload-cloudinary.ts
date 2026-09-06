'use server';

import { requireAuthContext } from '@/lib/security/auth-context';
import { requireAdmin, requireStaff } from '@/lib/security/authorization';
import { v2 as cloudinary } from 'cloudinary';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const ALLOWED_FOLDERS = new Set(['pets', 'doctors']);

export const uploadImageAction = async (
	formData: FormData,
): Promise<string> => {
	const context = await requireAuthContext();

	requireStaff(context);

	const file = formData.get('file');
	const folder = formData.get('folder');

	if (!(file instanceof File)) {
		throw new Error('Nenhum arquivo selecionado');
	}

	if (typeof folder !== 'string' || !ALLOWED_FOLDERS.has(folder)) {
		throw new Error('Destino de upload inválido');
	}

	/*
	 * Somente admin pode alterar imagens
	 * relacionadas a veterinários.
	 */
	if (folder === 'doctors') {
		requireAdmin(context);
	}

	if (!ALLOWED_MIME_TYPES.has(file.type)) {
		throw new Error('Formato de imagem não permitido');
	}

	if (file.size > MAX_IMAGE_SIZE) {
		throw new Error('A imagem deve possuir no máximo 5 MB');
	}

	const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
	const apiKey = process.env.CLOUDINARY_API_KEY;
	const apiSecret = process.env.CLOUDINARY_API_SECRET;

	if (!cloudName || !apiKey || !apiSecret) {
		throw new Error('Configuração do Cloudinary ausente');
	}

	cloudinary.config({
		cloud_name: cloudName,
		api_key: apiKey,
		api_secret: apiSecret,
	});

	const arrayBuffer = await file.arrayBuffer();

	const buffer = Buffer.from(arrayBuffer);

	return new Promise<string>((resolve, reject) => {
		cloudinary.uploader
			.upload_stream(
				{
					folder,
					resource_type: 'image',
					allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
				},
				(error, result) => {
					if (error) {
						console.error('Falha no upload para Cloudinary');

						return reject(new Error('Erro ao enviar imagem'));
					}

					if (!result?.secure_url) {
						return reject(new Error('Cloudinary não retornou URL da imagem'));
					}

					resolve(result.secure_url);
				},
			)
			.end(buffer);
	});
};
