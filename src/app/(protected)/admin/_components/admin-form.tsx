'use client';

import {
	changeUserId,
	linkCurrentClerkIdentity,
} from '@/api/actions/admin.actions';
import { Button } from '@/components/ui/button';
import { FolderCodeIcon, LinkIcon, Loader2Icon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

interface AdminFormClientProps {
	environment: 'development' | 'production';
}

const AdminFormClient = ({ environment }: AdminFormClientProps) => {
	const changeToProd = async () => {
		changeUserIdAction.execute({ environment: 'prod' });
	};

	const changeToDev = async () => {
		changeUserIdAction.execute({ environment: 'dev' });
	};

	const changeUserIdAction = useAction(changeUserId, {
		onSuccess: () => {
			toast.success('Usuário alterado com sucesso!');
		},
		onError: (err) => {
			console.error({ err });
			toast.error('Ocorreu um erro ao alterar o usuário!');
		},
	});

	const linkIdentityAction = useAction(linkCurrentClerkIdentity, {
		onSuccess: () => {
			toast.success(
				`Identidade vinculada ao ambiente ${environment === 'development' ? 'de desenvolvimento' : 'de produção'}!`,
			);
		},
		onError: (err) => {
			console.error({ err });
			toast.error('Não foi possível vincular a identidade atual.');
		},
	});

	return (
		<div className='flex flex-col gap-4'>
			<h1 className='text-2xl font-bold'>Identidade Clerk</h1>
			<p>
				Ambiente atual:{' '}
				<strong>
					{environment === 'development' ? 'Desenvolvimento' : 'Produção'}
				</strong>
			</p>

			<Button
				className='w-full lg:w-80'
				onClick={() => linkIdentityAction.execute({})}
				disabled={linkIdentityAction.isPending}
			>
				{linkIdentityAction.isPending ? (
					<Loader2Icon className='animate-spin' />
				) : (
					<LinkIcon />
				)}
				Vincular identidade deste ambiente
			</Button>

			<hr />

			<h2 className='text-xl font-semibold'>Alternância temporária</h2>
			<p>Alterar o ID legado para acessar o outro ambiente.</p>

			<div className='flex flex-col lg:flex-row gap-4 w-full'>
				<Button className='w-full lg:w-60' onClick={changeToProd}>
					{changeUserIdAction.isPending ? (
						<>
							<Loader2Icon className='animate-spin' />
							Mudando...
						</>
					) : (
						<>
							<FolderCodeIcon />
							Mudar para prod
						</>
					)}
				</Button>

				<Button className='w-full lg:w-60' onClick={changeToDev}>
					{changeUserIdAction.isPending ? (
						<>
							<Loader2Icon className='animate-spin' />
							Mudando...
						</>
					) : (
						<>
							<FolderCodeIcon />
							Mudar para dev
						</>
					)}
				</Button>
			</div>
		</div>
	);
};

export default AdminFormClient;
