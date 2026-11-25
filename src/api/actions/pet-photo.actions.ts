'use server';

import { db } from '@/db';
import { petsTable } from '@/db/schema';
import { getPetPhotoError, matchesPetPhotoSignature } from '@/lib/pets/pet-photo';
import { discardUnattachedTutorPhoto, uploadTutorPetPhoto } from '@/lib/pets/pet-photo-storage';
import { requireAuthContext } from '@/lib/security/auth-context';
import { buildPetAccessCondition } from '@/lib/security/pet-access';
import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

export async function updateTutorPetPhoto(
	formData: FormData,
): Promise<{ success: true; photo: string | null } | { success: false; error: string }> {
	try {
		const context = await requireAuthContext();
		if (context.role !== 'customer' || !context.customerId) {
			return { success: false, error: 'Você não tem permissão para alterar esta foto.' };
		}
		const parsed = z
			.object({ petId: z.uuid(), operation: z.enum(['upload', 'remove']), expectedPhoto: z.string().max(4096) })
			.safeParse({
				petId: formData.get('petId'),
				operation: formData.get('operation'),
				expectedPhoto: formData.get('expectedPhoto'),
			});
		if (!parsed.success) return { success: false, error: 'Solicitação inválida.' };
		const { petId, operation, expectedPhoto } = parsed.data;
		const access = buildPetAccessCondition(context, petId);
		if (!access) return { success: false, error: 'Você não tem permissão para alterar esta foto.' };
		const pet = await db.query.petsTable.findFirst({
			columns: { id: true, photo: true },
			where: access,
		});
		if (!pet) return { success: false, error: 'Pet não encontrado ou sem permissão de acesso.' };

		if ((pet.photo ?? '') !== expectedPhoto) {
			return { success: false, error: 'A foto foi alterada. Atualize a página e tente novamente.' };
		}

		let upload: { url: string; publicId: string } | null = null;
		if (operation === 'upload') {
			const file = formData.get('file');
			if (!(file instanceof File)) return { success: false, error: 'Selecione uma imagem.' };
			const error = getPetPhotoError(file);
			if (error) return { success: false, error };
			const bytes = new Uint8Array(await file.arrayBuffer());
			if (!matchesPetPhotoSignature(file.type, bytes)) {
				return { success: false, error: 'O conteúdo do arquivo não corresponde a uma imagem permitida.' };
			}
			upload = await uploadTutorPetPhoto(bytes);
		}

		// Revalida o vínculo no UPDATE e não sobrescreve uma foto alterada
		// por outro tutor durante o upload. Nenhum campo cadastral é aceito.
		const [updated] = await db
			.update(petsTable)
			.set({
				photo: upload?.url ?? null,
				updatedAt: new Date(),
			})
			.where(and(access, pet.photo === null ? isNull(petsTable.photo) : eq(petsTable.photo, pet.photo)))
			.returning({ photo: petsTable.photo });

		if (!updated) {
			if (upload) await discardUnattachedTutorPhoto(upload.publicId);
			return { success: false, error: 'O vínculo ou a foto foi alterado. Atualize a página e tente novamente.' };
		}

		// Não destrói imagens antigas: URLs legadas podem ser compartilhadas.
		revalidatePath(`/pets/${petId}`);
		revalidatePath('/pets');
		revalidatePath('/dashboard');
		return { success: true, photo: updated.photo };
	} catch {
		// Em falhas de banco com resultado incerto, preserva o arquivo enviado.
		console.error('Falha ao atualizar a foto do pet.');
		return { success: false, error: 'Não foi possível alterar a foto. Atualize a página e tente novamente.' };
	}
}
