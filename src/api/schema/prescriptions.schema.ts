import {
	breedsTable,
	doctorsTable,
	petsTable,
	petWeightsTable,
	prescriptionSignaturesTable,
	prescriptionsTable,
	speciesTable,
	usersTable,
} from '@/db/schema';

export type PrescriptionsWithRelations =
	typeof prescriptionsTable.$inferSelect & {
		doctor: typeof doctorsTable.$inferSelect & {
			user: typeof usersTable.$inferSelect;
		};
		pet: typeof petsTable.$inferSelect & {
			breed: typeof breedsTable.$inferSelect & {
				specie: typeof speciesTable.$inferSelect;
			};
			weightHistory?: (typeof petWeightsTable.$inferSelect & {
				author?: typeof usersTable.$inferSelect;
			})[];
		};
		signature: Pick<
			typeof prescriptionSignaturesTable.$inferSelect,
			'id' | 'signedAt' | 'pdfSha256'
		> | null;
	};
