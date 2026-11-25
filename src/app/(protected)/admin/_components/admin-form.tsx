'use client';

import { confirmClerkLink, previewClerkLink } from '@/api/actions/admin-clerk-link.actions';
import { verifyCurrentClerkIdentity } from '@/api/actions/admin.actions';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { ClerkEnvironment } from '@/lib/integrations/clerk-environment';
import type { UserRole } from '@/lib/security/roles';
import { CheckCircle2, LinkIcon, Loader2Icon, SearchIcon, ShieldCheck } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

type IdentityUser = {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	identities: { environment: ClerkEnvironment; clerkUserId: string }[];
};
const environmentLabels = { development: 'Desenvolvimento', production: 'Produção' };
const roleLabels = { admin: 'Admin', doctor: 'Doctor', customer: 'Customer' };

function LinkIdentityDialog({
	user,
	environment,
	onClose,
}: {
	user: IdentityUser;
	environment: ClerkEnvironment;
	onClose: () => void;
}) {
	const router = useRouter();
	const [clerkId, setClerkId] = useState('');
	const [preview, setPreview] = useState<{ name: string; email: string; clerkUserId: string } | null>(null);
	const [error, setError] = useState('');
	const validation = useAction(previewClerkLink, {
		onSuccess: ({ data }) => {
			if (data?.ok) {
				setPreview(data.value);
				setError('');
			} else {
				setPreview(null);
				setError(data?.message ?? 'Não foi possível validar a identidade.');
			}
		},
		onError: () => {
			setPreview(null);
			setError('Não foi possível validar a identidade. Confira o Clerk ID e a configuração do ambiente.');
		},
	});
	const confirmation = useAction(confirmClerkLink, {
		onSuccess: ({ data }) => {
			if (data?.ok) {
				toast.success('Identidade vinculada com sucesso.');
				onClose();
				router.refresh();
			} else {
				setPreview(null);
				setError(data?.message ?? 'Não foi possível vincular a identidade.');
			}
		},
		onError: () => {
			setPreview(null);
			setError('Não foi possível vincular a identidade. Nenhuma substituição foi realizada.');
		},
	});
	const pending = validation.isPending || confirmation.isPending;
	const input = { userId: user.id, clerkUserId: clerkId.trim(), environment };
	const validId = /^user_[A-Za-z0-9]+$/.test(input.clerkUserId) && input.clerkUserId.length <= 128;
	return (
		<Dialog
			open
			onOpenChange={(open) => {
				if (!open && !pending) onClose();
			}}
		>
			<DialogContent
				showCloseButton={!pending}
				onEscapeKeyDown={(event) => {
					if (pending) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (pending) event.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Vincular identidade Clerk</DialogTitle>
					<DialogDescription>
						Associe uma identidade existente ao cadastro, sem alterar o perfil nem os outros vínculos.
					</DialogDescription>
				</DialogHeader>
				<div className='rounded-lg border bg-muted/30 p-3 text-sm space-y-1 break-all'>
					<p className='font-semibold'>{user.name}</p>
					<p>{user.email}</p>
					<p>
						{roleLabels[user.role]} · {environmentLabels[environment]}
					</p>
				</div>
				<div className='space-y-2'>
					<label htmlFor='clerk-link-id' className='text-sm font-medium'>
						Clerk User ID
					</label>
					<Input
						id='clerk-link-id'
						value={clerkId}
						maxLength={128}
						disabled={pending}
						autoComplete='off'
						placeholder='user_...'
						onChange={(event) => {
							setClerkId(event.target.value);
							setPreview(null);
							setError('');
						}}
					/>
					<p className='text-xs text-muted-foreground'>
						Copie o identificador do painel do Clerk do ambiente atual.
					</p>
				</div>
				{preview && (
					<div className='space-y-1 rounded-lg border p-3 text-sm break-all'>
						<p className='flex items-center gap-2 font-medium text-emerald-700'>
							<ShieldCheck className='size-4' /> E-mail primário verificado
						</p>
						<p>{preview.name}</p>
						<p>{preview.email}</p>
						<p className='text-muted-foreground'>{preview.clerkUserId}</p>
						<p>Confirme que esta é a identidade correta antes de vincular.</p>
					</div>
				)}
				{error && (
					<p role='alert' className='text-sm text-destructive'>
						{error}
					</p>
				)}
				<DialogFooter>
					<Button variant='outline' disabled={pending} onClick={onClose}>
						Cancelar
					</Button>
					{preview ? (
						<Button
							disabled={pending || preview.clerkUserId !== input.clerkUserId}
							onClick={() => confirmation.execute({ ...input, confirmed: true })}
						>
							{confirmation.isPending ? <Loader2Icon className='animate-spin' /> : <LinkIcon />} Confirmar
							vínculo
						</Button>
					) : (
						<Button disabled={pending || !validId} onClick={() => validation.execute(input)}>
							{validation.isPending ? <Loader2Icon className='animate-spin' /> : <ShieldCheck />} Validar
							identidade
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

const AdminFormClient = ({
	environment,
	users,
	filter,
	page,
	hasNext,
}: {
	environment: ClerkEnvironment;
	users: IdentityUser[];
	filter: string;
	page: number;
	hasNext: boolean;
}) => {
	const [selected, setSelected] = useState<IdentityUser | null>(null);
	const verifyIdentityAction = useAction(verifyCurrentClerkIdentity, {
		onSuccess: () =>
			toast.success(`Identidade confirmada no ambiente de ${environmentLabels[environment].toLowerCase()}!`),
		onError: () => toast.error('Não foi possível verificar a identidade atual.'),
	});
	const pageHref = (next: number) => `/admin?${new URLSearchParams({ filter, page: String(next) }).toString()}`;
	return (
		<div className='space-y-5'>
			<div className='flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between'>
				<div className='space-y-1'>
					<p className='font-semibold'>Ambiente atual: {environmentLabels[environment]}</p>
					<p className='text-sm text-muted-foreground'>
						Consulte ambos os ambientes. Novos vínculos são permitidos apenas no ambiente atual.
					</p>
				</div>
				<Button
					variant='outline'
					disabled={verifyIdentityAction.isPending}
					onClick={() => verifyIdentityAction.execute({})}
				>
					{verifyIdentityAction.isPending ? <Loader2Icon className='animate-spin' /> : <ShieldCheck />}{' '}
					Verificar minha identidade
				</Button>
			</div>
			<form action='/admin' method='get' className='flex flex-wrap items-end gap-2'>
				<div className='flex-1 min-w-48 space-y-1'>
					<label htmlFor='identity-filter' className='text-sm font-medium'>
						Buscar usuários
					</label>
					<Input
						key={filter}
						id='identity-filter'
						name='filter'
						defaultValue={filter}
						maxLength={120}
						placeholder='Nome ou e-mail'
					/>
				</div>
				<Button type='submit'>
					<SearchIcon /> Buscar
				</Button>
				{filter && (
					<Button asChild variant='outline'>
						<Link href='/admin'>Limpar</Link>
					</Button>
				)}
			</form>
			<div className='grid gap-3 @container'>
				{users.map((user) => (
					<article key={user.id} className='rounded-xl border bg-card p-4 space-y-3'>
						<div className='flex flex-wrap justify-between gap-2'>
							<div className='min-w-0 break-all'>
								<h2 className='font-semibold'>{user.name}</h2>
								<p className='text-sm text-muted-foreground'>{user.email}</p>
							</div>
							<span className='self-start rounded-md bg-muted px-2 py-1 text-xs font-medium'>
								{roleLabels[user.role]}
							</span>
						</div>
						<div className='grid gap-2 @min-[40rem]:grid-cols-2'>
							{(['production', 'development'] as const).map((env) => {
								const identity = user.identities.find((item) => item.environment === env);
								return (
									<div key={env} className='rounded-lg border p-3 space-y-2 min-w-0'>
										<p className='font-medium text-sm'>{environmentLabels[env]}</p>
										{identity ? (
											<>
												<p className='flex items-center gap-1 text-xs text-emerald-700'>
													<CheckCircle2 className='size-4' /> Vinculado
												</p>
												<p className='break-all text-xs text-muted-foreground'>
													{identity.clerkUserId}
												</p>
											</>
										) : (
											<>
												<p className='text-xs text-muted-foreground'>Não vinculado</p>
												{env === environment ? (
													<Button
														size='sm'
														variant='outline'
														onClick={() => setSelected(user)}
													>
														<LinkIcon /> Vincular
													</Button>
												) : (
													<p className='text-xs text-muted-foreground'>
														Acesse este ambiente para vincular.
													</p>
												)}
											</>
										)}
									</div>
								);
							})}
						</div>
					</article>
				))}
				{users.length === 0 && (
					<p className='rounded-lg border p-6 text-center text-sm text-muted-foreground'>
						Nenhum usuário encontrado.
					</p>
				)}
			</div>
			<div className='flex items-center justify-between gap-2'>
				<span className='text-sm text-muted-foreground'>Página {page}</span>
				<div className='flex gap-2'>
					{page > 1 && (
						<Button variant='outline' asChild>
							<Link href={pageHref(page - 1)}>Anterior</Link>
						</Button>
					)}
					{hasNext && (
						<Button variant='outline' asChild>
							<Link href={pageHref(page + 1)}>Próxima</Link>
						</Button>
					)}
				</div>
			</div>
			{selected && (
				<LinkIdentityDialog
					key={selected.id}
					user={selected}
					environment={environment}
					onClose={() => setSelected(null)}
				/>
			)}
		</div>
	);
};

export default AdminFormClient;
