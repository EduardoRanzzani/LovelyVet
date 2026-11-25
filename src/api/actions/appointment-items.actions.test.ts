import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => {
	const where = vi.fn(async () => undefined);
	const set = vi.fn(() => ({ where }));
	const values = vi.fn(async () => undefined);
	const tx = {
		execute: vi.fn(),
		query: {
			appointmentsTable: { findFirst: vi.fn() },
			appointmentChargesTable: { findFirst: vi.fn() },
			vaccinesTable: { findMany: vi.fn() },
			servicesTable: { findMany: vi.fn() },
			productsTable: { findMany: vi.fn() },
			appointmentProductItemsTable: { findMany: vi.fn() },
			appointmentItemsTable: { findMany: vi.fn() },
		},
		delete: vi.fn(() => ({ where })),
		insert: vi.fn(() => ({ values })),
		update: vi.fn(() => ({ set })),
	};
	return {
		tx,
		where,
		set,
		values,
		requireAuthContext: vi.fn(),
		requireStaff: vi.fn(),
		requireAccessibleAppointment: vi.fn(),
		revalidatePath: vi.fn(),
		transaction: vi.fn(),
	};
});
vi.mock('@/db', () => ({ db: { transaction: mocks.transaction } }));
vi.mock('@/lib/next-safe-action', () => ({
	actionClient: {
		schema: () => ({
			action: (callback: (arg: { parsedInput: unknown }) => unknown) => (parsedInput: unknown) =>
				callback({ parsedInput }),
		}),
	},
}));
vi.mock('@/lib/security/auth-context', () => ({ requireAuthContext: mocks.requireAuthContext }));
vi.mock('@/lib/security/authorization', () => ({ requireStaff: mocks.requireStaff }));
vi.mock('@/lib/security/appointment-access', () => ({
	requireAccessibleAppointment: mocks.requireAccessibleAppointment,
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
import { updateAppointmentItems } from './appointment-items.actions';
const appointmentId = '11111111-1111-4111-8111-111111111111';
const serviceId = '22222222-2222-4222-8222-222222222222';
const productId = '33333333-3333-4333-8333-333333333333';
const context = { role: 'doctor', doctorId: '55555555-5555-4555-8555-555555555555' };
const input = {
	appointmentId,
	services: [{ id: serviceId, quantity: 1, unitPriceInCents: 8500, discountInCents: 0 }],
	products: [{ id: productId, quantity: 2, unitPriceInCents: 2000, discountInCents: 500 }],
};
describe('edição financeira do atendimento', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.requireAuthContext.mockResolvedValue(context);
		mocks.transaction.mockImplementation((fn: (tx: typeof mocks.tx) => Promise<unknown>) => fn(mocks.tx));
		mocks.tx.query.appointmentChargesTable.findFirst.mockResolvedValue(undefined);
		mocks.tx.query.appointmentsTable.findFirst.mockResolvedValue({
			id: appointmentId,
			isPaid: false,
			status: 'completed',
			doctorId: context.doctorId,
			pet: { breed: { specieId: 'specie' } },
		});
		mocks.tx.query.vaccinesTable.findMany.mockResolvedValue([]);
		mocks.tx.query.servicesTable.findMany.mockResolvedValue([{ id: serviceId, specieId: null }]);
		mocks.tx.query.productsTable.findMany.mockResolvedValue([{ id: productId, active: true }]);
		mocks.tx.query.appointmentProductItemsTable.findMany.mockResolvedValue([]);
		mocks.tx.query.appointmentItemsTable.findMany.mockResolvedValue([]);
	});
	it('rejeita cliente antes de alterar o banco', async () => {
		mocks.requireStaff.mockImplementation(() => {
			throw new Error('Não autorizado');
		});
		await expect(updateAppointmentItems(input)).rejects.toThrow('Não autorizado');
		expect(mocks.transaction).not.toHaveBeenCalled();
	});
	it('rejeita edição de atendimento pago', async () => {
		mocks.tx.query.appointmentsTable.findFirst.mockResolvedValue({
			id: appointmentId,
			isPaid: true,
			status: 'completed',
			doctorId: context.doctorId,
			pet: { breed: { specieId: 'specie' } },
		});
		await expect(updateAppointmentItems(input)).rejects.toThrow('indisponível');
		expect(mocks.tx.delete).not.toHaveBeenCalled();
	});
	it('bloqueia edição se já existe cobrança emitida', async () => {
		mocks.tx.query.appointmentChargesTable.findFirst.mockResolvedValue({ id: 'charge-id' });
		await expect(updateAppointmentItems(input)).rejects.toThrow('cobrança emitida');
		expect(mocks.tx.delete).not.toHaveBeenCalled();
	});
	it('protege vacina associada contra remoção', async () => {
		mocks.tx.query.vaccinesTable.findMany.mockResolvedValue([{ serviceId }]);
		await expect(updateAppointmentItems({ ...input, services: [] })).rejects.toThrow('vacina aplicada');
		expect(mocks.tx.delete).not.toHaveBeenCalled();
	});
	it('rejeita serviço de outra espécie antes de alterar itens', async () => {
		mocks.tx.query.servicesTable.findMany.mockResolvedValue([{ id: serviceId, specieId: 'other-specie' }]);
		await expect(updateAppointmentItems(input)).rejects.toThrow('Serviço incompatível com a espécie do paciente.');
		expect(mocks.tx.delete).not.toHaveBeenCalled();
		expect(mocks.tx.insert).not.toHaveBeenCalled();
		expect(mocks.tx.update).not.toHaveBeenCalled();
	});
	it('aceita serviço da espécie do paciente', async () => {
		mocks.tx.query.servicesTable.findMany.mockResolvedValue([{ id: serviceId, specieId: 'specie' }]);
		await expect(updateAppointmentItems(input)).resolves.toEqual({ success: true, totalPriceInCents: 12000 });
	});
	it('recalcula o total em centavos e persiste linhas', async () => {
		await expect(updateAppointmentItems(input)).resolves.toEqual({ success: true, totalPriceInCents: 12000 });
		expect(mocks.tx.insert).toHaveBeenCalledTimes(2);
		expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ totalPriceInCents: 12000 }));
	});
	it('rejeita itens duplicados e desconto inválido', async () => {
		await expect(
			updateAppointmentItems({ ...input, products: [...input.products, ...input.products] }),
		).rejects.toThrow('duplicados');
		await expect(
			updateAppointmentItems({ ...input, products: [{ ...input.products[0], discountInCents: 99999 }] }),
		).rejects.toThrow('Desconto');
	});
});
