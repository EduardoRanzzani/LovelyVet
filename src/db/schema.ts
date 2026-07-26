import { relations } from 'drizzle-orm';
import {
	boolean,
	date,
	index,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	time,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';

// --- ENUMS ---

export const userRoleEnum = pgEnum('user_role', [
	'admin',
	'doctor',
	'customer',
]);
export const sexEnum = pgEnum('sex', ['male', 'female']);
export const petStatusEnum = pgEnum('pet_status', ['alive', 'dead', 'missing']);
export const appointmentStatusEnum = pgEnum('appointment_status', [
	'pending',
	'confirmed',
	'in_progress',
	'completed',
	'cancelled',
	'no_show',
]);

// --- TABLES ---

// Usuários
export const usersTable = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	image: text('image'),
	clerkUserId: text('clerk_user_id').unique(),
	role: userRoleEnum('role').default('customer').notNull(),
	isRegistrationComplete: boolean('is_registration_complete')
		.default(false)
		.notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

// Veterinários
export const doctorsTable = pgTable('doctors', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => usersTable.id),
	phone: text('phone').notNull(),
	cpf: text('cpf').notNull().unique(),
	gender: sexEnum('gender').notNull(),
	licenseNumber: text('license_number').notNull(),
	licenseState: text('license_state').notNull(),
	specialty: text('specialty'),
	availableFromWeekDay: integer('available_from_week_day').notNull().default(1),
	availableToWeekDay: integer('available_to_week_day').notNull().default(5),
	availableFromTime: time('available_from_time').notNull(),
	availableToTime: time('available_to_time').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

// Clientes
export const customersTable = pgTable('customers', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => usersTable.id),
	phone: text('phone').notNull(),
	cpf: text('cpf').notNull().unique(),
	gender: sexEnum('gender').notNull(),
	postalCode: text('postal_code').notNull(),
	address: text('address').notNull(),
	addressNumber: text('address_number').notNull().default('S/N'),
	neighborhood: text('neighborhood').notNull(),
	city: text('city').notNull(),
	state: text('state').notNull().default('MS'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

// Espécies
export const speciesTable = pgTable('species', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull().unique(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

// Raças
export const breedsTable = pgTable('breeds', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	specieId: uuid('specie_id')
		.notNull()
		.references(() => speciesTable.id),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

// Pets
export const petsTable = pgTable('pets', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	birthDate: date('birth_date').notNull(),
	breedId: uuid('breed_id')
		.notNull()
		.references(() => breedsTable.id),
	color: text('color').notNull(),
	gender: sexEnum('gender').notNull(),
	sterile: boolean('sterile').default(false).notNull(),
	status: petStatusEnum('status').default('alive').notNull(),
	photo: text('photo'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

// Pets ↔ Tutores (clientes): many-to-many
export const petTutorsTable = pgTable(
	'pet_tutors',
	{
		petId: uuid('pet_id')
			.notNull()
			.references(() => petsTable.id),
		customerId: uuid('customer_id')
			.notNull()
			.references(() => customersTable.id),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.petId, table.customerId] }),
		customerIdx: index('pet_tutors_customer_id_idx').on(table.customerId),
	}),
);

// Histórico de pesos
export const petWeightsTable = pgTable('pet_weights', {
	id: uuid('id').primaryKey().defaultRandom(),
	petId: uuid('pet_id')
		.notNull()
		.references(() => petsTable.id),
	weightInGrams: integer('weight_in_grams').notNull(),
	authorId: uuid('user_id')
		.notNull()
		.references(() => usersTable.id),
	measuredAt: timestamp('measured_at').defaultNow().notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Documentos e Exames (Anexos)
export const petAttachmentsTable = pgTable('pet_attachments', {
	id: uuid('id').primaryKey().defaultRandom(),
	petId: uuid('pet_id')
		.notNull()
		.references(() => petsTable.id),
	name: text('name').notNull(),
	url: text('url').notNull(),
	type: text('type').notNull(),
	authorId: uuid('author_id')
		.notNull()
		.references(() => usersTable.id),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Observações / Notas Gerais (que não são prontuários)
export const petNotesTable = pgTable('pet_notes', {
	id: uuid('id').primaryKey().defaultRandom(),
	petId: uuid('pet_id')
		.notNull()
		.references(() => petsTable.id),
	content: text('content').notNull(),
	authorId: uuid('author_id')
		.notNull()
		.references(() => usersTable.id),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Serviços prestados
export const servicesTable = pgTable('services', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	description: text('description'),
	priceInCents: integer('price_in_cents').notNull(),
	durationMinutes: integer('duration_minutes').default(30).notNull(),
	specieId: uuid('specie_id').references(() => speciesTable.id),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

// Agendamentos
export const appointmentsTable = pgTable(
	'appointments',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		petId: uuid('pet_id')
			.notNull()
			.references(() => petsTable.id),
		doctorId: uuid('doctor_id')
			.notNull()
			.references(() => doctorsTable.id),
		scheduledAt: timestamp('scheduled_at').notNull(),
		status: appointmentStatusEnum('status').default('pending').notNull(),
		notes: text('notes'),
		totalPriceInCents: integer('total_price_in_cents').notNull(),
		isPaid: boolean('is_paid').default(false).notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => ({
		scheduledIdx: index('scheduled_at_idx').on(table.scheduledAt),
	}),
);

// Tabela Many-to-Many para múltiplos serviços por atendimento
export const appointmentItemsTable = pgTable(
	'appointment_items',
	{
		appointmentId: uuid('appointment_id')
			.notNull()
			.references(() => appointmentsTable.id, { onDelete: 'cascade' }),
		serviceId: uuid('service_id')
			.notNull()
			.references(() => servicesTable.id),
		priceAtTimeInCents: integer('price_at_time_in_cents').notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.appointmentId, table.serviceId] }),
	}),
);

// Prontuário Médico
export const medicalRecordsTable = pgTable('medical_records', {
	id: uuid('id').primaryKey().defaultRandom(),
	appointmentId: uuid('appointment_id').references(() => appointmentsTable.id),
	petId: uuid('pet_id')
		.notNull()
		.references(() => petsTable.id),
	doctorId: uuid('doctor_id')
		.notNull()
		.references(() => doctorsTable.id),
	diagnosis: text('diagnosis').notNull(),
	treatmentPlan: text('treatment_plan'),
	weightAtTimeInGrams: integer('weight_at_time_in_grams'),
	observations: text('observations'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

// Receitas
export const prescriptionsTable = pgTable('prescriptions', {
	id: uuid('id').primaryKey().defaultRandom(),
	petId: uuid('pet_id')
		.notNull()
		.references(() => petsTable.id),
	doctorId: uuid('doctor_id')
		.notNull()
		.references(() => doctorsTable.id),
	appointmentId: uuid('appointment_id').references(() => appointmentsTable.id),
	content: text('content').notNull(),
	issuedAt: timestamp('issued_at').defaultNow().notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

// Itens da receita (Catálogo de medicamentos)
export const prescriptionItemsTable = pgTable('prescription_items', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	pharmacy: text('pharmacy').notNull(),
	quantity: text('quantity').notNull(),
	orientations: text('orientations').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

// Vínculo entre uma receita e seus itens (Many-to-Many)
export const prescriptionMedicineItemsTable = pgTable(
	'prescription_medicine_items',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		prescriptionId: uuid('prescription_id')
			.notNull()
			.references(() => prescriptionsTable.id, { onDelete: 'cascade' }),
		prescriptionItemId: uuid('prescription_item_id')
			.notNull()
			.references(() => prescriptionItemsTable.id, { onDelete: 'cascade' }),
	},
);

// Plantões
export const shiftsTable = pgTable('shifts', {
	id: uuid('id').primaryKey().defaultRandom(),
	doctorId: uuid('doctor_id')
		.notNull()
		.references(() => doctorsTable.id),
	clinicId: uuid('clinic_id').references(() => clinicsTable.id, {
		onDelete: 'set null',
	}),
	clinicName: text('clinic_name').notNull(),
	startTime: timestamp('start_time').notNull(),
	endTime: timestamp('end_time').notNull(),
	requesterName: text('requester_name'),
	amountInCents: integer('amount_in_cents'),
	isPaid: boolean('is_paid').default(false).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

// Vacinas
export const vaccinesTable = pgTable('vaccines', {
	id: uuid('id').primaryKey().defaultRandom(),
	petId: uuid('pet_id')
		.notNull()
		.references(() => petsTable.id),
	name: text('name').notNull(),
	applicationDate: timestamp('application_date').notNull(),
	nextDoseDate: timestamp('next_dose_date'),
	lotNumber: text('lot_number'),
	manufacturer: text('manufacturer'),
	doctorId: uuid('doctor_id')
		.notNull()
		.references(() => doctorsTable.id),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Patologias / Condições Crônicas
export const pathologiesTable = pgTable('pathologies', {
	id: uuid('id').primaryKey().defaultRandom(),
	petId: uuid('pet_id')
		.notNull()
		.references(() => petsTable.id),
	name: text('name').notNull(),
	description: text('description'),
	status: text('status').default('active').notNull(),
	diagnosedAt: date('diagnosed_at').notNull(),
	doctorId: uuid('doctor_id')
		.notNull()
		.references(() => doctorsTable.id),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Clínicas
export const clinicsTable = pgTable('clinics', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	phone: text('phone'),
	defaultShiftPriceInCents: integer('default_shift_price_in_cents').notNull(),
	isActive: boolean('is_active').default(true).notNull(),
	postalCode: text('postal_code').notNull(),
	address: text('address').notNull(),
	addressNumber: text('address_number').notNull().default('S/N'),
	neighborhood: text('neighborhood').notNull(),
	city: text('city').notNull(),
	state: text('state').notNull().default('MS'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull(),
});

// --- RELATIONS ---

export const usersRelations = relations(usersTable, ({ one }) => ({
	doctor: one(doctorsTable, {
		fields: [usersTable.id],
		references: [doctorsTable.userId],
	}),
	customer: one(customersTable, {
		fields: [usersTable.id],
		references: [customersTable.userId],
	}),
}));

export const doctorsRelations = relations(doctorsTable, ({ one, many }) => ({
	user: one(usersTable, {
		fields: [doctorsTable.userId],
		references: [usersTable.id],
	}),
	appointments: many(appointmentsTable),
	shifts: many(shiftsTable),
}));

export const customersRelations = relations(
	customersTable,
	({ one, many }) => ({
		user: one(usersTable, {
			fields: [customersTable.userId],
			references: [usersTable.id],
		}),
		petTutors: many(petTutorsTable),
	}),
);

export const speciesRelations = relations(speciesTable, ({ many }) => ({
	breeds: many(breedsTable),
	services: many(servicesTable),
}));

export const breedsRelations = relations(breedsTable, ({ one, many }) => ({
	specie: one(speciesTable, {
		fields: [breedsTable.specieId],
		references: [speciesTable.id],
	}),
	pets: many(petsTable),
}));

export const servicesRelations = relations(servicesTable, ({ one }) => ({
	specie: one(speciesTable, {
		fields: [servicesTable.specieId],
		references: [speciesTable.id],
	}),
}));

export const petTutorsRelations = relations(petTutorsTable, ({ one }) => ({
	pet: one(petsTable, {
		fields: [petTutorsTable.petId],
		references: [petsTable.id],
	}),
	tutor: one(customersTable, {
		fields: [petTutorsTable.customerId],
		references: [customersTable.id],
	}),
}));

export const petsRelations = relations(petsTable, ({ one, many }) => ({
	breed: one(breedsTable, {
		fields: [petsTable.breedId],
		references: [breedsTable.id],
	}),
	petTutors: many(petTutorsTable),
	medicalRecords: many(medicalRecordsTable),
	appointments: many(appointmentsTable),
	weightHistory: many(petWeightsTable),
	vaccines: many(vaccinesTable),
	pathologies: many(pathologiesTable),
	attachments: many(petAttachmentsTable),
	notes: many(petNotesTable),
	prescriptions: many(prescriptionsTable),
}));

export const petWeightsRelations = relations(petWeightsTable, ({ one }) => ({
	pet: one(petsTable, {
		fields: [petWeightsTable.petId],
		references: [petsTable.id],
	}),
	author: one(usersTable, {
		fields: [petWeightsTable.authorId],
		references: [usersTable.id],
	}),
}));

export const appointmentsRelations = relations(
	appointmentsTable,
	({ one, many }) => ({
		pet: one(petsTable, {
			fields: [appointmentsTable.petId],
			references: [petsTable.id],
		}),
		doctor: one(doctorsTable, {
			fields: [appointmentsTable.doctorId],
			references: [doctorsTable.id],
		}),
		items: many(appointmentItemsTable),
		medicalRecord: one(medicalRecordsTable, {
			fields: [appointmentsTable.id],
			references: [medicalRecordsTable.appointmentId],
		}),
	}),
);

export const appointmentItemsRelations = relations(
	appointmentItemsTable,
	({ one }) => ({
		appointment: one(appointmentsTable, {
			fields: [appointmentItemsTable.appointmentId],
			references: [appointmentsTable.id],
		}),
		service: one(servicesTable, {
			fields: [appointmentItemsTable.serviceId],
			references: [servicesTable.id],
		}),
	}),
);

export const prescriptionsRelations = relations(
	prescriptionsTable,
	({ one, many }) => ({
		pet: one(petsTable, {
			fields: [prescriptionsTable.petId],
			references: [petsTable.id],
		}),
		doctor: one(doctorsTable, {
			fields: [prescriptionsTable.doctorId],
			references: [doctorsTable.id],
		}),
		appointment: one(appointmentsTable, {
			fields: [prescriptionsTable.appointmentId],
			references: [appointmentsTable.id],
		}),
		medicineItems: many(prescriptionMedicineItemsTable),
	}),
);

export const prescriptionItemsRelations = relations(
	prescriptionItemsTable,
	({ many }) => ({
		prescriptionMedicineItems: many(prescriptionMedicineItemsTable),
	}),
);

export const prescriptionMedicineItemsRelations = relations(
	prescriptionMedicineItemsTable,
	({ one }) => ({
		prescription: one(prescriptionsTable, {
			fields: [prescriptionMedicineItemsTable.prescriptionId],
			references: [prescriptionsTable.id],
		}),
		prescriptionItem: one(prescriptionItemsTable, {
			fields: [prescriptionMedicineItemsTable.prescriptionItemId],
			references: [prescriptionItemsTable.id],
		}),
	}),
);

export const medicalRecordsRelations = relations(
	medicalRecordsTable,
	({ one }) => ({
		appointment: one(appointmentsTable, {
			fields: [medicalRecordsTable.appointmentId],
			references: [appointmentsTable.id],
		}),
		pet: one(petsTable, {
			fields: [medicalRecordsTable.petId],
			references: [petsTable.id],
		}),
		doctor: one(doctorsTable, {
			fields: [medicalRecordsTable.doctorId],
			references: [doctorsTable.id],
		}),
	}),
);

export const shiftsRelations = relations(shiftsTable, ({ one }) => ({
	doctor: one(doctorsTable, {
		fields: [shiftsTable.doctorId],
		references: [doctorsTable.id],
	}),
	clinic: one(clinicsTable, {
		fields: [shiftsTable.clinicId],
		references: [clinicsTable.id],
	}),
}));

export const vaccinesRelations = relations(vaccinesTable, ({ one }) => ({
	pet: one(petsTable, {
		fields: [vaccinesTable.petId],
		references: [petsTable.id],
	}),
	doctor: one(doctorsTable, {
		fields: [vaccinesTable.doctorId],
		references: [doctorsTable.id],
	}),
}));

export const pathologiesRelations = relations(pathologiesTable, ({ one }) => ({
	pet: one(petsTable, {
		fields: [pathologiesTable.petId],
		references: [petsTable.id],
	}),
	doctor: one(doctorsTable, {
		fields: [pathologiesTable.doctorId],
		references: [doctorsTable.id],
	}),
}));

export const petAttachmentsRelations = relations(
	petAttachmentsTable,
	({ one }) => ({
		pet: one(petsTable, {
			fields: [petAttachmentsTable.petId],
			references: [petsTable.id],
		}),
		author: one(usersTable, {
			fields: [petAttachmentsTable.authorId],
			references: [usersTable.id],
		}),
	}),
);

export const petNotesRelations = relations(petNotesTable, ({ one }) => ({
	pet: one(petsTable, {
		fields: [petNotesTable.petId],
		references: [petsTable.id],
	}),
	author: one(usersTable, {
		fields: [petNotesTable.authorId],
		references: [usersTable.id],
	}),
}));

export const clinicsRelations = relations(clinicsTable, ({ many }) => ({
	shifts: many(shiftsTable),
}));

// import { relations } from 'drizzle-orm';
// import {
// 	boolean,
// 	date,
// 	index,
// 	integer,
// 	pgEnum,
// 	pgTable,
// 	primaryKey,
// 	text,
// 	time,
// 	timestamp,
// 	uuid,
// } from 'drizzle-orm/pg-core';

// // --- ENUMS ---

// export const userRoleEnum = pgEnum('user_role', [
// 	'admin',
// 	'doctor',
// 	'customer',
// ]);
// export const sexEnum = pgEnum('sex', ['male', 'female']);
// export const petStatusEnum = pgEnum('pet_status', ['alive', 'dead', 'missing']);
// export const appointmentStatusEnum = pgEnum('appointment_status', [
// 	'pending',
// 	'confirmed',
// 	'in_progress',
// 	'completed',
// 	'cancelled',
// 	'no_show',
// ]);

// // --- TABLES ---
// // Usuários
// export const usersTable = pgTable('users', {
// 	id: uuid('id').defaultRandom().primaryKey(),
// 	name: text('name').notNull(),
// 	email: text('email').notNull().unique(),
// 	image: text('image'),
// 	clerkUserId: text('clerk_user_id').unique(),
// 	role: userRoleEnum('role').default('customer').notNull(),
// 	isRegistrationComplete: boolean('is_registration_complete')
// 		.default(false)
// 		.notNull(),
// 	createdAt: timestamp('created_at').defaultNow().notNull(),
// 	updatedAt: timestamp('updated_at')
// 		.defaultNow()
// 		.$onUpdate(() => new Date())
// 		.notNull(),
// });

// // Veterinários
// export const doctorsTable = pgTable('doctors', {
// 	id: uuid('id').primaryKey().defaultRandom(),
// 	userId: uuid('user_id')
// 		.notNull()
// 		.references(() => usersTable.id),
// 	phone: text('phone').notNull(),
// 	cpf: text('cpf').notNull().unique(),
// 	gender: sexEnum('gender').notNull(),
// 	licenseNumber: text('license_number').notNull(),
// 	licenseState: text('license_state').notNull(),
// 	specialty: text('specialty'),
// 	// Uso de TIME para facilitar lógica de agenda
// 	availableFromWeekDay: integer('available_from_week_day').notNull().default(1),
// 	availableToWeekDay: integer('available_to_week_day').notNull().default(5),
// 	availableFromTime: time('available_from_time').notNull(),
// 	availableToTime: time('available_to_time').notNull(),
// 	createdAt: timestamp('created_at').defaultNow().notNull(),
// 	updatedAt: timestamp('updated_at')
// 		.defaultNow()
// 		.$onUpdate(() => new Date())
// 		.notNull(),
// });

// // Clientes
// export const customersTable = pgTable('customers', {
// 	id: uuid('id').primaryKey().defaultRandom(),
// 	userId: uuid('user_id')
// 		.notNull()
// 		.references(() => usersTable.id),
// 	phone: text('phone').notNull(),
// 	cpf: text('cpf').notNull().unique(),
// 	gender: sexEnum('gender').notNull(),
// 	postalCode: text('postal_code').notNull(),
// 	address: text('address').notNull(),
// 	addressNumber: text('address_number').notNull().default('S/N'),
// 	neighborhood: text('neighborhood').notNull(),
// 	city: text('city').notNull(),
// 	state: text('state').notNull().default('MS'),
// 	createdAt: timestamp('created_at').defaultNow().notNull(),
// 	updatedAt: timestamp('updated_at')
// 		.defaultNow()
// 		.$onUpdate(() => new Date())
// 		.notNull(),
// });

// // Espécies
// export const speciesTable = pgTable('species', {
// 	id: uuid('id').primaryKey().defaultRandom(),
// 	name: text('name').notNull().unique(),
// 	createdAt: timestamp('created_at').defaultNow().notNull(),
// 	updatedAt: timestamp('updated_at')
// 		.defaultNow()
// 		.$onUpdate(() => new Date())
// 		.notNull(),
// });

// // Raças
// export const breedsTable = pgTable('breeds', {
// 	id: uuid('id').primaryKey().defaultRandom(),
// 	name: text('name').notNull(),
// 	specieId: uuid('specie_id')
// 		.notNull()
// 		.references(() => speciesTable.id),
// 	createdAt: timestamp('created_at').defaultNow().notNull(),
// 	updatedAt: timestamp('updated_at')
// 		.defaultNow()
// 		.$onUpdate(() => new Date())
// 		.notNull(),
// });

// // Pets
// export const petsTable = pgTable('pets', {
// 	id: uuid('id').primaryKey().defaultRandom(),
// 	name: text('name').notNull(),
// 	birthDate: date('birth_date').notNull(),
// 	breedId: uuid('breed_id')
// 		.notNull()
// 		.references(() => breedsTable.id),
// 	color: text('color').notNull(),
// 	gender: sexEnum('gender').notNull(),
// 	sterile: boolean('sterile').default(false).notNull(),
// 	status: petStatusEnum('status').default('alive').notNull(),
// 	photo: text('photo'),
// 	createdAt: timestamp('created_at').defaultNow().notNull(),
// 	updatedAt: timestamp('updated_at')
// 		.defaultNow()
// 		.$onUpdate(() => new Date())
// 		.notNull(),
// });

// // Pets ↔ Tutores (clientes): many-to-many
// export const petTutorsTable = pgTable(
// 	'pet_tutors',
// 	{
// 		petId: uuid('pet_id')
// 			.notNull()
// 			.references(() => petsTable.id),
// 		customerId: uuid('customer_id')
// 			.notNull()
// 			.references(() => customersTable.id),
// 	},
// 	(table) => ({
// 		pk: primaryKey({ columns: [table.petId, table.customerId] }),
// 		customerIdx: index('pet_tutors_customer_id_idx').on(table.customerId),
// 	}),
// );

// // Histórico de pesos
// export const petWeightsTable = pgTable('pet_weights', {
// 	id: uuid('id').primaryKey().defaultRandom(),
// 	petId: uuid('pet_id')
// 		.notNull()
// 		.references(() => petsTable.id),
// 	weightInGrams: integer('weight_in_grams').notNull(),
// 	authorId: uuid('user_id')
// 		.notNull()
// 		.references(() => usersTable.id),
// 	measuredAt: timestamp('measured_at').defaultNow().notNull(),
// 	createdAt: timestamp('created_at').defaultNow().notNull(),
// });

// // Documentos e Exames (Anexos)
// export const petAttachmentsTable = pgTable('pet_attachments', {
// 	id: uuid('id').primaryKey().defaultRandom(),
// 	petId: uuid('pet_id')
// 		.notNull()
// 		.references(() => petsTable.id),
// 	name: text('name').notNull(), // Ex: "Hemograma Completo"
// 	url: text('url').notNull(), // URL do S3/Uploadthing
// 	type: text('type').notNull(), // 'exam', 'document', 'image'
// 	authorId: uuid('author_id')
// 		.notNull()
// 		.references(() => usersTable.id),
// 	createdAt: timestamp('created_at').defaultNow().notNull(),
// });

// // Observações / Notas Gerais (que não são prontuários)
// export const petNotesTable = pgTable('pet_notes', {
// 	id: uuid('id').primaryKey().defaultRandom(),
// 	petId: uuid('pet_id')
// 		.notNull()
// 		.references(() => petsTable.id),
// 	content: text('content').notNull(),
// 	authorId: uuid('author_id')
// 		.notNull()
// 		.references(() => usersTable.id),
// 	createdAt: timestamp('created_at').defaultNow().notNull(),
// });

// // Serviços prestados
// export const servicesTable = pgTable('services', {
// 	id: uuid('id').primaryKey().defaultRandom(),
// 	name: text('name').notNull(),
// 	description: text('description'),
// 	priceInCents: integer('price_in_cents').notNull(),
// 	durationMinutes: integer('duration_minutes').default(30).notNull(),
// 	specieId: uuid('specie_id').references(() => speciesTable.id),
// 	createdAt: timestamp('created_at').defaultNow().notNull(),
// 	updatedAt: timestamp('updated_at')
// 		.defaultNow()
// 		.$onUpdate(() => new Date())
// 		.notNull(),
// });

// // Agendamentos
// export const appointmentsTable = pgTable(
// 	'appointments',
// 	{
// 		id: uuid('id').primaryKey().defaultRandom(),
// 		petId: uuid('pet_id')
// 			.notNull()
// 			.references(() => petsTable.id),
// 		doctorId: uuid('doctor_id')
// 			.notNull()
// 			.references(() => doctorsTable.id),
// 		scheduledAt: timestamp('scheduled_at').notNull(),
// 		status: appointmentStatusEnum('status').default('pending').notNull(),
// 		notes: text('notes'),
// 		totalPriceInCents: integer('total_price_in_cents').notNull(),
// 		isPaid: boolean('is_paid').default(false).notNull(),
// 		createdAt: timestamp('created_at').defaultNow().notNull(),
// 		updatedAt: timestamp('updated_at')
// 			.defaultNow()
// 			.$onUpdate(() => new Date())
// 			.notNull(),
// 	},
// 	(table) => ({
// 		scheduledIdx: index('scheduled_at_idx').on(table.scheduledAt),
// 	}),
// );

// // Tabela Many-to-Many para múltiplos serviços por atendimento
// export const appointmentItemsTable = pgTable(
// 	'appointment_items',
// 	{
// 		appointmentId: uuid('appointment_id')
// 			.notNull()
// 			.references(() => appointmentsTable.id, { onDelete: 'cascade' }), // Adicionado cascade aqui
// 		serviceId: uuid('service_id')
// 			.notNull()
// 			.references(() => servicesTable.id),
// 		priceAtTimeInCents: integer('price_at_time_in_cents').notNull(),
// 	},
// 	(table) => ({
// 		pk: primaryKey({ columns: [table.appointmentId, table.serviceId] }),
// 	}),
// );

// // Prontuário Médico
// export const medicalRecordsTable = pgTable('medical_records', {
// 	id: uuid('id').primaryKey().defaultRandom(),
// 	appointmentId: uuid('appointment_id').references(() => appointmentsTable.id),
// 	petId: uuid('pet_id')
// 		.notNull()
// 		.references(() => petsTable.id),
// 	doctorId: uuid('doctor_id')
// 		.notNull()
// 		.references(() => doctorsTable.id),
// 	diagnosis: text('diagnosis').notNull(),
// 	treatmentPlan: text('treatment_plan'),
// 	weightAtTimeInGrams: integer('weight_at_time_in_grams'),
// 	observations: text('observations'),
// 	createdAt: timestamp('created_at').defaultNow().notNull(),
// 	updatedAt: timestamp('updated_at')
// 		.defaultNow()
// 		.$onUpdate(() => new Date())
// 		.notNull(),
// });

// // Modelos de receitas
// export const prescriptionTemplatesTable = pgTable('prescription_templates', {
// 	id: uuid('id').primaryKey().defaultRandom(),
// 	title: text('title').notNull(), // Ex: "Vermífugo Padrão", "Pós-Cirúrgico Castração"
// 	content: text('content').notNull(), // O corpo do texto da receita
// 	doctorId: uuid('doctor_id')
// 		.notNull()
// 		.references(() => doctorsTable.id),
// 	createdAt: timestamp('created_at').defaultNow().notNull(),
// 	updatedAt: timestamp('updated_at')
// 		.defaultNow()
// 		.$onUpdate(() => new Date())
// 		.notNull(),
// });

// // Receitas
// export const prescriptionsTable = pgTable('prescriptions', {
// 	id: uuid('id').primaryKey().defaultRandom(),
// 	petId: uuid('pet_id')
// 		.notNull()
// 		.references(() => petsTable.id),
// 	doctorId: uuid('doctor_id')
// 		.notNull()
// 		.references(() => doctorsTable.id),
// 	appointmentId: uuid('appointment_id').references(() => appointmentsTable.id),
// 	content: text('content').notNull(), // O texto final da receita (editado ou do template)
// 	issuedAt: timestamp('issued_at').defaultNow().notNull(),
// 	createdAt: timestamp('created_at').defaultNow().notNull(),
// 	updatedAt: timestamp('updated_at')
// 		.defaultNow()
// 		.$onUpdate(() => new Date())
// 		.notNull(),
// });

// // Itens da receita (ex: Dipirona gotas - (farmácia humana) - 1fr. Orientações: dar 1 gota/kg a cada 12h)
// export const prescriptionItemsTable = pgTable('prescription_items', {
// 	id: uuid('id').primaryKey().defaultRandom(),
// 	name: text('name').notNull(),
// 	pharmacy: text('pharmacy').notNull(),
// 	quantity: text('quantity').notNull(),
// 	orientations: text('orientations').notNull(),
// 	createdAt: timestamp('created_at').defaultNow().notNull(),
// 	updatedAt: timestamp('updated_at')
// 		.defaultNow()
// 		.$onUpdate(() => new Date())
// 		.notNull(),
// });

// // Vínculo entre uma receita e seus itens (muitos-para-muitos, já que um mesmo item pode ser usado em várias receitas)
// export const prescriptionMedicineItemsTable = pgTable(
// 	'prescription_medicine_items',
// 	{
// 		id: uuid('id').primaryKey().defaultRandom(),
// 		prescriptionId: uuid('prescription_id')
// 			.notNull()
// 			.references(() => prescriptionsTable.id),
// 		prescriptionItemId: uuid('prescription_item_id')
// 			.notNull()
// 			.references(() => prescriptionItemsTable.id),
// 	},
// );

// // Plantões
// export const shiftsTable = pgTable('shifts', {
// 	id: uuid('id').primaryKey().defaultRandom(),
// 	doctorId: uuid('doctor_id')
// 		.notNull()
// 		.references(() => doctorsTable.id),
// 	clinicId: uuid('clinic_id').references(() => clinicsTable.id, {
// 		onDelete: 'set null',
// 	}),
// 	clinicName: text('clinic_name').notNull(),
// 	startTime: timestamp('start_time').notNull(),
// 	endTime: timestamp('end_time').notNull(),
// 	requesterName: text('requester_name'),
// 	amountInCents: integer('amount_in_cents'),
// 	isPaid: boolean('is_paid').default(false).notNull(),
// 	createdAt: timestamp('created_at').defaultNow().notNull(),
// 	updatedAt: timestamp('updated_at')
// 		.defaultNow()
// 		.$onUpdate(() => new Date())
// 		.notNull(),
// });

// // Vacinas
// export const vaccinesTable = pgTable('vaccines', {
// 	id: uuid('id').primaryKey().defaultRandom(),
// 	petId: uuid('pet_id')
// 		.notNull()
// 		.references(() => petsTable.id),
// 	name: text('name').notNull(), // Ex: "V10", "Raiva"
// 	applicationDate: timestamp('application_date').notNull(),
// 	nextDoseDate: timestamp('next_dose_date'), // Importante para o dashboard/agenda
// 	lotNumber: text('lot_number'),
// 	manufacturer: text('manufacturer'),
// 	doctorId: uuid('doctor_id')
// 		.notNull()
// 		.references(() => doctorsTable.id),
// 	createdAt: timestamp('created_at').defaultNow().notNull(),
// });

// // Patologias / Condições Crônicas
// export const pathologiesTable = pgTable('pathologies', {
// 	id: uuid('id').primaryKey().defaultRandom(),
// 	petId: uuid('pet_id')
// 		.notNull()
// 		.references(() => petsTable.id),
// 	name: text('name').notNull(),
// 	description: text('description'),
// 	status: text('status').default('active').notNull(),
// 	diagnosedAt: date('diagnosed_at').notNull(),
// 	doctorId: uuid('doctor_id')
// 		.notNull()
// 		.references(() => doctorsTable.id),
// 	createdAt: timestamp('created_at').defaultNow().notNull(),
// });

// export const clinicsTable = pgTable('clinics', {
// 	id: uuid('id').primaryKey().defaultRandom(),
// 	name: text('name').notNull(),
// 	phone: text('phone'),
// 	defaultShiftPriceInCents: integer('default_shift_price_in_cents').notNull(),
// 	isActive: boolean('is_active').default(true).notNull(),
// 	postalCode: text('postal_code').notNull(),
// 	address: text('address').notNull(),
// 	addressNumber: text('address_number').notNull().default('S/N'),
// 	neighborhood: text('neighborhood').notNull(),
// 	city: text('city').notNull(),
// 	state: text('state').notNull().default('MS'),
// 	createdAt: timestamp('created_at').defaultNow().notNull(),
// 	updatedAt: timestamp('updated_at')
// 		.defaultNow()
// 		.$onUpdate(() => new Date())
// 		.notNull(),
// });

// // --- RELATIONS ---

// export const usersRelations = relations(usersTable, ({ one }) => ({
// 	doctor: one(doctorsTable, {
// 		fields: [usersTable.id],
// 		references: [doctorsTable.userId],
// 	}),
// 	customer: one(customersTable, {
// 		fields: [usersTable.id],
// 		references: [customersTable.userId],
// 	}),
// }));

// export const doctorsRelations = relations(doctorsTable, ({ one, many }) => ({
// 	user: one(usersTable, {
// 		fields: [doctorsTable.userId],
// 		references: [usersTable.id],
// 	}),
// 	appointments: many(appointmentsTable),
// 	shifts: many(shiftsTable),
// }));

// export const customersRelations = relations(
// 	customersTable,
// 	({ one, many }) => ({
// 		user: one(usersTable, {
// 			fields: [customersTable.userId],
// 			references: [usersTable.id],
// 		}),
// 		petTutors: many(petTutorsTable),
// 	}),
// );

// export const speciesRelations = relations(speciesTable, ({ many }) => ({
// 	breeds: many(breedsTable),
// 	services: many(servicesTable),
// }));

// export const breedsRelations = relations(breedsTable, ({ one, many }) => ({
// 	specie: one(speciesTable, {
// 		fields: [breedsTable.specieId],
// 		references: [speciesTable.id],
// 	}),
// 	pets: many(petsTable),
// }));

// export const servicesRelations = relations(servicesTable, ({ one }) => ({
// 	specie: one(speciesTable, {
// 		fields: [servicesTable.specieId],
// 		references: [speciesTable.id],
// 	}),
// }));

// export const petTutorsRelations = relations(petTutorsTable, ({ one }) => ({
// 	pet: one(petsTable, {
// 		fields: [petTutorsTable.petId],
// 		references: [petsTable.id],
// 	}),
// 	tutor: one(customersTable, {
// 		fields: [petTutorsTable.customerId],
// 		references: [customersTable.id],
// 	}),
// }));

// export const petsRelations = relations(petsTable, ({ one, many }) => ({
// 	breed: one(breedsTable, {
// 		fields: [petsTable.breedId],
// 		references: [breedsTable.id],
// 	}),
// 	petTutors: many(petTutorsTable),
// 	medicalRecords: many(medicalRecordsTable),
// 	appointments: many(appointmentsTable),
// 	weightHistory: many(petWeightsTable),
// 	vaccines: many(vaccinesTable),
// 	pathologies: many(pathologiesTable),
// 	attachments: many(petAttachmentsTable),
// 	notes: many(petNotesTable),
// 	prescriptions: many(prescriptionsTable),
// }));

// export const petWeightsRelations = relations(petWeightsTable, ({ one }) => ({
// 	pet: one(petsTable, {
// 		fields: [petWeightsTable.petId],
// 		references: [petsTable.id],
// 	}),
// 	author: one(usersTable, {
// 		fields: [petWeightsTable.authorId],
// 		references: [usersTable.id],
// 	}),
// }));

// export const appointmentsRelations = relations(
// 	appointmentsTable,
// 	({ one, many }) => ({
// 		pet: one(petsTable, {
// 			fields: [appointmentsTable.petId],
// 			references: [petsTable.id],
// 		}),
// 		doctor: one(doctorsTable, {
// 			fields: [appointmentsTable.doctorId],
// 			references: [doctorsTable.id],
// 		}),
// 		items: many(appointmentItemsTable),
// 		medicalRecord: one(medicalRecordsTable, {
// 			fields: [appointmentsTable.id],
// 			references: [medicalRecordsTable.appointmentId],
// 		}),
// 	}),
// );

// export const appointmentItemsRelations = relations(
// 	appointmentItemsTable,
// 	({ one }) => ({
// 		appointment: one(appointmentsTable, {
// 			fields: [appointmentItemsTable.appointmentId],
// 			references: [appointmentsTable.id],
// 		}),
// 		service: one(servicesTable, {
// 			fields: [appointmentItemsTable.serviceId],
// 			references: [servicesTable.id],
// 		}),
// 	}),
// );

// export const prescriptionTemplatesRelations = relations(
// 	prescriptionTemplatesTable,
// 	({ one }) => ({
// 		doctor: one(doctorsTable, {
// 			fields: [prescriptionTemplatesTable.doctorId],
// 			references: [doctorsTable.id],
// 		}),
// 	}),
// );

// export const prescriptionsRelations = relations(
// 	prescriptionsTable,
// 	({ one, many }) => ({
// 		pet: one(petsTable, {
// 			fields: [prescriptionsTable.petId],
// 			references: [petsTable.id],
// 		}),
// 		doctor: one(doctorsTable, {
// 			fields: [prescriptionsTable.doctorId],
// 			references: [doctorsTable.id],
// 		}),
// 		appointment: one(appointmentsTable, {
// 			fields: [prescriptionsTable.appointmentId],
// 			references: [appointmentsTable.id],
// 		}),
// 		items: many(prescriptionItemsTable),
// 	}),
// );

// export const prescriptionMedicineItemsRelations = relations(
// 	prescriptionMedicineItemsTable,
// 	({ one }) => ({
// 		prescription: one(prescriptionsTable, {
// 			fields: [prescriptionMedicineItemsTable.prescriptionId],
// 			references: [prescriptionsTable.id],
// 		}),
// 		medicine: one(prescriptionItemsTable, {
// 			fields: [prescriptionMedicineItemsTable.prescriptionItemId],
// 			references: [prescriptionItemsTable.id],
// 		}),
// 	}),
// );

// export const medicalRecordsRelations = relations(
// 	medicalRecordsTable,
// 	({ one }) => ({
// 		appointment: one(appointmentsTable, {
// 			fields: [medicalRecordsTable.appointmentId],
// 			references: [appointmentsTable.id],
// 		}),
// 		pet: one(petsTable, {
// 			fields: [medicalRecordsTable.petId],
// 			references: [petsTable.id],
// 		}),
// 		doctor: one(doctorsTable, {
// 			fields: [medicalRecordsTable.doctorId],
// 			references: [doctorsTable.id],
// 		}),
// 	}),
// );

// export const shiftsRelations = relations(shiftsTable, ({ one }) => ({
// 	doctor: one(doctorsTable, {
// 		fields: [shiftsTable.doctorId],
// 		references: [doctorsTable.id],
// 	}),
// 	clinic: one(clinicsTable, {
// 		fields: [shiftsTable.clinicId],
// 		references: [clinicsTable.id],
// 	}),
// }));

// export const vaccinesRelations = relations(vaccinesTable, ({ one }) => ({
// 	pet: one(petsTable, {
// 		fields: [vaccinesTable.petId],
// 		references: [petsTable.id],
// 	}),
// 	doctor: one(doctorsTable, {
// 		fields: [vaccinesTable.doctorId],
// 		references: [doctorsTable.id],
// 	}),
// }));

// export const pathologiesRelations = relations(pathologiesTable, ({ one }) => ({
// 	pet: one(petsTable, {
// 		fields: [pathologiesTable.petId],
// 		references: [petsTable.id],
// 	}),
// 	doctor: one(doctorsTable, {
// 		fields: [pathologiesTable.doctorId],
// 		references: [doctorsTable.id],
// 	}),
// }));

// export const petAttachmentsRelations = relations(
// 	petAttachmentsTable,
// 	({ one }) => ({
// 		pet: one(petsTable, {
// 			fields: [petAttachmentsTable.petId],
// 			references: [petsTable.id],
// 		}),
// 		author: one(usersTable, {
// 			fields: [petAttachmentsTable.authorId],
// 			references: [usersTable.id],
// 		}),
// 	}),
// );

// export const petNotesRelations = relations(petNotesTable, ({ one }) => ({
// 	pet: one(petsTable, {
// 		fields: [petNotesTable.petId],
// 		references: [petsTable.id],
// 	}),
// 	author: one(usersTable, {
// 		fields: [petNotesTable.authorId],
// 		references: [usersTable.id],
// 	}),
// }));

// export const clinicsRelations = relations(clinicsTable, ({ many }) => ({
// 	shifts: many(shiftsTable),
// }));
