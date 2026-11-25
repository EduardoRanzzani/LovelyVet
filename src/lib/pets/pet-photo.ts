export const MAX_PET_PHOTO_BYTES = 4 * 1024 * 1024;
export const PET_PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';

export function getPetPhotoError(file: Pick<File, 'size' | 'type'>): string | null {
	if (file.size === 0) return 'Selecione uma imagem não vazia.';
	if (file.size > MAX_PET_PHOTO_BYTES) return 'A imagem deve ter até 4 MB.';
	if (!PET_PHOTO_ACCEPT.split(',').includes(file.type)) {
		return 'Selecione uma imagem JPG, PNG ou WebP.';
	}
	return null;
}

// A assinatura é conferida no servidor, além do MIME informado pelo navegador.
// A decodificação completa é responsabilidade do Cloudinary.
export function matchesPetPhotoSignature(type: string, bytes: Uint8Array): boolean {
	const startsAt = (offset: number, signature: number[]) =>
		signature.every((value, index) => bytes[offset + index] === value);
	if (type === 'image/jpeg') return startsAt(0, [0xff, 0xd8, 0xff]);
	if (type === 'image/png') return startsAt(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
	if (type === 'image/webp') return startsAt(0, [0x52, 0x49, 0x46, 0x46]) && startsAt(8, [0x57, 0x45, 0x42, 0x50]);
	return false;
}
