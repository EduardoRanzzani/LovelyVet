// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), find: vi.fn(), update: vi.fn(), set: vi.fn(), where: vi.fn(), returning: vi.fn(), upload: vi.fn(), discard: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/db', async () => {
	const { QueryBuilder } = await import('drizzle-orm/pg-core');
	const qb = new QueryBuilder();
	return { db: { select: qb.select.bind(qb), query: { petsTable: { findFirst: mocks.find } }, update: mocks.update } };
});
vi.mock('@/lib/security/auth-context', () => ({ requireAuthContext: mocks.auth }));
vi.mock('@/lib/pets/pet-photo-storage', () => ({ uploadTutorPetPhoto: mocks.upload, discardUnattachedTutorPhoto: mocks.discard }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidate }));
import { updateTutorPetPhoto } from './pet-photo.actions';

const petId = '11111111-1111-4111-8111-111111111111';
const tutorId = '22222222-2222-4222-8222-222222222222';
const url = 'https://res.cloudinary.com/example/image/upload/new.jpg';
const original = 'https://res.cloudinary.com/example/image/upload/old.jpg';
function request(operation = 'upload', id = petId) {
	const form = new FormData();
	form.set('petId', id);
	form.set('operation', operation);
	form.set('expectedPhoto', original);
	if (operation === 'upload') form.set('file', new File([Uint8Array.from([255,216,255,0])], 'pet.jpg', { type: 'image/jpeg' }));
	return form;
}

describe('alteração exclusiva da foto pelo tutor', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.auth.mockResolvedValue({ role: 'customer', customerId: tutorId });
		mocks.find.mockResolvedValue({ id: petId, photo: original });
		mocks.upload.mockResolvedValue({ url, publicId: 'pets/tutor-photos/new' });
		mocks.update.mockReturnValue({ set: mocks.set });
		mocks.set.mockReturnValue({ where: mocks.where });
		mocks.where.mockReturnValue({ returning: mocks.returning });
		mocks.returning.mockResolvedValue([{ photo: url }]);
	});
	it.each(['admin', 'doctor'])('não amplia a permissão de %s por esta action', async role => {
		mocks.auth.mockResolvedValue({ role, customerId: tutorId });
		expect((await updateTutorPetPhoto(request())).success).toBe(false);
		expect(mocks.find).not.toHaveBeenCalled();
		expect(mocks.upload).not.toHaveBeenCalled();
	});
	it('rejeita autenticação ausente e tutor sem cadastro', async () => {
		mocks.auth.mockRejectedValueOnce(new Error('Não autenticado'));
		expect((await updateTutorPetPhoto(request())).success).toBe(false);
		mocks.auth.mockResolvedValue({ role: 'customer', customerId: null });
		expect((await updateTutorPetPhoto(request())).success).toBe(false);
		expect(mocks.find).not.toHaveBeenCalled();
	});
	it('rejeita UUID inválido e operações desconhecidas', async () => {
		expect((await updateTutorPetPhoto(request('upload', 'invalid'))).success).toBe(false);
		expect((await updateTutorPetPhoto(request('edit'))).success).toBe(false);
		expect(mocks.find).not.toHaveBeenCalled();
	});
	it('não envia arquivos nem grava para pet sem vínculo', async () => {
		mocks.find.mockResolvedValue(undefined);
		expect((await updateTutorPetPhoto(request())).success).toBe(false);
		expect(mocks.upload).not.toHaveBeenCalled();
		expect(mocks.update).not.toHaveBeenCalled();
	});
	it('rejeita conteúdo falso antes do upload', async () => {
		const form = request();
		form.set('file', new File(['fake'], 'pet.jpg', { type: 'image/jpeg' }));
		expect((await updateTutorPetPhoto(form)).success).toBe(false);
		expect(mocks.upload).not.toHaveBeenCalled();
	});
	it('grava apenas a foto e updatedAt, revalidando o vínculo e a foto anterior no UPDATE', async () => {
		const form = request();
		form.set('name', 'não deve ser gravado');
		form.set('photo', 'https://example.com/evil');
		expect(await updateTutorPetPhoto(form)).toEqual({ success: true, photo: url });
		expect(mocks.set).toHaveBeenCalledWith({ photo: url, updatedAt: expect.any(Date) });
		const query = new PgDialect().sqlToQuery(mocks.where.mock.calls[0][0] as SQL);
		expect(query.sql).toContain('"pet_tutors"');
		expect(query.sql).toContain('"customer_id"');
		expect(query.params).toEqual(expect.arrayContaining([petId, tutorId, original]));
		expect(mocks.revalidate).toHaveBeenCalledWith('/dashboard');
		expect(mocks.revalidate).toHaveBeenCalledWith(`/pets/${petId}`);
	});
	it('remove apenas a referência sem enviar ou apagar imagem antiga', async () => {
		mocks.returning.mockResolvedValue([{ photo: null }]);
		expect(await updateTutorPetPhoto(request('remove'))).toEqual({ success: true, photo: null });
		expect(mocks.set).toHaveBeenCalledWith({ photo: null, updatedAt: expect.any(Date) });
		expect(mocks.upload).not.toHaveBeenCalled();
		expect(mocks.discard).not.toHaveBeenCalled();
	});
	it('bloqueia concorrência ou revogação de vínculo e descarta somente o novo upload', async () => {
		mocks.returning.mockResolvedValue([]);
		expect((await updateTutorPetPhoto(request())).success).toBe(false);
		expect(mocks.discard).toHaveBeenCalledWith('pets/tutor-photos/new');
		expect(mocks.revalidate).not.toHaveBeenCalled();
	});
	it('rejeita modal desatualizado antes de enviar a foto', async () => {
		mocks.find.mockResolvedValue({ id: petId, photo: null });
		expect((await updateTutorPetPhoto(request())).success).toBe(false);
		expect(mocks.upload).not.toHaveBeenCalled();
		expect(mocks.update).not.toHaveBeenCalled();
	});
	it('não grava quando o upload falha', async () => {
		mocks.upload.mockRejectedValue(new Error('upload failed'));
		expect((await updateTutorPetPhoto(request())).success).toBe(false);
		expect(mocks.update).not.toHaveBeenCalled();
	});
});
