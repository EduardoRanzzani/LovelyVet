import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TutorPetPhotoDialog from './tutor-pet-photo-dialog';

const mocks = vi.hoisted(() => ({ update: vi.fn(), refresh: vi.fn(), success: vi.fn() }));
vi.mock('@/api/actions/pet-photo.actions', () => ({ updateTutorPetPhoto: mocks.update }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock('sonner', () => ({ toast: { success: mocks.success } }));
vi.mock('next/image', () => ({
	default: ({ alt, src }: { alt: string; src: string }) => <span role='img' aria-label={alt} data-src={src} />,
}));

const petId = '11111111-1111-4111-8111-111111111111';
const photo = 'https://res.cloudinary.com/example/image/upload/old.jpg';
function open(photoValue: string | null) {
	render(<TutorPetPhotoDialog petId={petId} petName='Teste' photo={photoValue} />);
	const avatar = screen.getByRole('button', { name: 'Gerenciar foto de Teste' });
	fireEvent.click(within(avatar).getByRole('img', { name: 'Foto de Teste' }));
}

describe('modal de foto do pet', () => {
	const createObjectURL = vi.fn<(file: Blob) => string>();
	const revokeObjectURL = vi.fn<(url: string) => void>();
	beforeEach(() => {
		vi.resetAllMocks();
		createObjectURL.mockReturnValue('blob:photo-preview');
		vi.stubGlobal(
			'URL',
			class extends URL {
				static createObjectURL = createObjectURL;
				static revokeObjectURL = revokeObjectURL;
			},
		);
	});
	afterEach(() => {
		cleanup();
		vi.unstubAllGlobals();
	});

	function select(file: File) {
		fireEvent.change(screen.getByLabelText('Selecionar nova foto'), { target: { files: [file] } });
	}
	const imageFile = (name = 'photo.png') => new File(['image'], name, { type: 'image/png' });

	it.each([null, photo])('mostra a prévia local sem enviar ao servidor (foto: %s)', (photoValue) => {
		open(photoValue);
		const file = imageFile();
		select(file);
		expect(createObjectURL).toHaveBeenCalledWith(file);
		expect(screen.getByRole('img', { name: 'Prévia da nova foto do pet' })).toHaveAttribute(
			'data-src',
			'blob:photo-preview',
		);
		expect(screen.getByRole('button', { name: 'Salvar foto' })).toBeEnabled();
		expect(mocks.update).not.toHaveBeenCalled();
	});
	it('revoga a prévia anterior ao selecionar outro arquivo e ao cancelar', () => {
		open(photo);
		createObjectURL.mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second');
		select(imageFile('first.png'));
		select(imageFile('second.png'));
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:first');
		expect(screen.getByRole('img', { name: 'Prévia da nova foto do pet' })).toHaveAttribute(
			'data-src',
			'blob:second',
		);
		fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:second');
		fireEvent.click(screen.getByRole('button', { name: 'Gerenciar foto de Teste' }));
		expect(screen.getByRole('img', { name: 'Foto atual do pet' })).toHaveAttribute('data-src', photo);
		expect(screen.getByRole('button', { name: 'Salvar foto' })).toBeDisabled();
		expect(mocks.update).not.toHaveBeenCalled();
	});
	it('descarta a prévia ao selecionar formato inválido', () => {
		open(photo);
		select(imageFile());
		select(new File(['x'], 'x.svg', { type: 'image/svg+xml' }));
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:photo-preview');
		expect(createObjectURL).toHaveBeenCalledTimes(1);
		expect(screen.getByRole('img', { name: 'Foto atual do pet' })).toHaveAttribute('data-src', photo);
		expect(screen.getByRole('button', { name: 'Salvar foto' })).toBeDisabled();
	});
	it('envia o arquivo original somente ao salvar e libera a prévia após sucesso', async () => {
		mocks.update.mockResolvedValue({
			success: true,
			photo: 'https://res.cloudinary.com/example/image/upload/new.png',
		});
		open(photo);
		select(imageFile());
		fireEvent.click(screen.getByRole('button', { name: 'Salvar foto' }));
		await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
		const request = mocks.update.mock.calls[0][0] as FormData;
		expect(request.get('operation')).toBe('upload');
		expect(request.get('expectedPhoto')).toBe(photo);
		expect((request.get('file') as File).name).toBe('photo.png');
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:photo-preview');
	});
	it('libera a prévia ao desmontar o componente', () => {
		const { unmount } = render(<TutorPetPhotoDialog petId={petId} petName='Teste' photo={null} />);
		fireEvent.click(screen.getByRole('button', { name: 'Gerenciar foto de Teste' }));
		select(imageFile());
		unmount();
		expect(revokeObjectURL).toHaveBeenCalledWith('blob:photo-preview');
	});
	it.each([null, photo])('usa somente a imagem como gatilho do modal (foto: %s)', (photoValue) => {
		render(<TutorPetPhotoDialog petId={petId} petName='Teste' photo={photoValue} />);
		const avatar = screen.getByRole('button', { name: 'Gerenciar foto de Teste' });
		const image = within(avatar).getByRole('img', { name: 'Foto de Teste' });
		expect(screen.getAllByRole('button')).toHaveLength(1);
		expect(avatar.children).toHaveLength(1);
		fireEvent.click(image);
		expect(screen.getByRole('dialog')).toBeInTheDocument();
	});
	it('abre pelo avatar e não oferece remoção quando não há foto', () => {
		open(null);
		expect(screen.getByRole('dialog')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Salvar foto' })).toBeDisabled();
		expect(screen.queryByRole('button', { name: 'Remover foto atual' })).not.toBeInTheDocument();
	});
	it('exige confirmação para remover e atualiza após sucesso', async () => {
		mocks.update.mockResolvedValue({ success: true, photo: null });
		open(photo);
		fireEvent.click(screen.getByRole('button', { name: 'Remover foto atual' }));
		expect(mocks.update).not.toHaveBeenCalled();
		fireEvent.click(screen.getByRole('button', { name: 'Confirmar remoção' }));
		await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
		const request = mocks.update.mock.calls[0][0] as FormData;
		expect(request.get('operation')).toBe('remove');
		expect(request.get('petId')).toBe(petId);
		expect(request.get('expectedPhoto')).toBe(photo);
		expect(request.get('file')).toBeNull();
	});
	it('rejeita formato não permitido sem enviar o arquivo', () => {
		open(null);
		fireEvent.change(screen.getByLabelText('Selecionar nova foto'), {
			target: { files: [new File(['x'], 'x.svg', { type: 'image/svg+xml' })] },
		});
		expect(screen.getByRole('alert')).toHaveTextContent('JPG, PNG ou WebP');
		expect(screen.getByRole('button', { name: 'Salvar foto' })).toBeDisabled();
		expect(mocks.update).not.toHaveBeenCalled();
	});
});
