import { describe, expect, it } from 'vitest';
import { getPetPhotoError, matchesPetPhotoSignature, MAX_PET_PHOTO_BYTES } from './pet-photo';

describe('validação da foto do pet', () => {
	it.each(['image/jpeg', 'image/png', 'image/webp'])('aceita %s dentro do limite', (type) => {
		expect(getPetPhotoError({ type, size: MAX_PET_PHOTO_BYTES })).toBeNull();
	});
	it('rejeita arquivos vazios, grandes ou formatos não permitidos', () => {
		expect(getPetPhotoError({ type: 'image/png', size: 0 })).not.toBeNull();
		expect(getPetPhotoError({ type: 'image/png', size: MAX_PET_PHOTO_BYTES + 1 })).not.toBeNull();
		expect(getPetPhotoError({ type: 'image/svg+xml', size: 10 })).not.toBeNull();
	});
	it.each([
		['image/jpeg', [255, 216, 255]],
		['image/png', [137, 80, 78, 71, 13, 10, 26, 10]],
		['image/webp', [82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]],
	] as const)('confere a assinatura de %s', (type, signature) => {
		expect(matchesPetPhotoSignature(type, Uint8Array.from(signature))).toBe(true);
		expect(matchesPetPhotoSignature(type, Uint8Array.from([1, 2, 3]))).toBe(false);
	});
	it('rejeita MIME adulterado', () => {
		expect(matchesPetPhotoSignature('image/png', Uint8Array.from([255, 216, 255]))).toBe(false);
	});
});
