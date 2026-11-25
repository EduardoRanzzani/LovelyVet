// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), config: vi.fn(), upload: vi.fn(), end: vi.fn() }));
vi.mock('@/lib/security/auth-context', () => ({ requireAuthContext: mocks.auth }));
vi.mock('cloudinary', () => ({ v2: { config: mocks.config, uploader: { upload_stream: mocks.upload } } }));

import { uploadImageAction } from './upload-cloudinary';

function request(bytes: number[], type = 'image/jpeg', folder = 'pets') {
	const form = new FormData();
	form.set('file', new File([Uint8Array.from(bytes)], 'imagem.jpg', { type }));
	form.set('folder', folder);
	return form;
}

const jpeg = [255, 216, 255, 0];

describe('upload de imagens da equipe', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.auth.mockResolvedValue({ role: 'doctor' });
		vi.stubEnv('CLOUDINARY_CLOUD_NAME', 'teste');
		vi.stubEnv('CLOUDINARY_API_KEY', 'teste');
		vi.stubEnv('CLOUDINARY_API_SECRET', 'teste');
		mocks.upload.mockImplementation((_options, callback) => {
			callback(null, { secure_url: 'https://res.cloudinary.com/teste/image/upload/imagem.jpg' });
			return { end: mocks.end };
		});
	});
	afterEach(() => vi.unstubAllEnvs());

	it('rejeita imagem vazia antes do upload', async () => {
		await expect(uploadImageAction(request([]))).rejects.toThrow('imagem não vazia');
		expect(mocks.upload).not.toHaveBeenCalled();
	});
	it('rejeita conteúdo incompatível com MIME informado', async () => {
		await expect(uploadImageAction(request(jpeg, 'image/png'))).rejects.toThrow('não corresponde');
		expect(mocks.upload).not.toHaveBeenCalled();
	});
	it('mantém o bloqueio para tutor', async () => {
		mocks.auth.mockResolvedValue({ role: 'customer' });
		await expect(uploadImageAction(request(jpeg))).rejects.toThrow('não autorizado');
		expect(mocks.upload).not.toHaveBeenCalled();
	});
	it('bloqueia upload de veterinários por Doctor', async () => {
		await expect(uploadImageAction(request(jpeg, 'image/jpeg', 'doctors'))).rejects.toThrow('não autorizado');
		expect(mocks.upload).not.toHaveBeenCalled();
	});
	it('preserva upload de imagem de pet por Doctor', async () => {
		await expect(uploadImageAction(request(jpeg))).resolves.toContain('res.cloudinary.com');
		expect(mocks.upload).toHaveBeenCalledOnce();
		expect(mocks.end).toHaveBeenCalledOnce();
	});
	it('preserva upload de imagem de veterinário por Admin', async () => {
		mocks.auth.mockResolvedValue({ role: 'admin' });
		await expect(uploadImageAction(request(jpeg, 'image/jpeg', 'doctors'))).resolves.toContain(
			'res.cloudinary.com',
		);
		expect(mocks.upload).toHaveBeenCalledOnce();
	});
});
