'use client';

import { verifyCurrentClerkIdentity } from '@/api/actions/admin.actions';
import { Button } from '@/components/ui/button';
import { LinkIcon, Loader2Icon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

interface AdminFormClientProps {
	environment: 'development' | 'production';
}

const AdminFormClient = ({ environment }: AdminFormClientProps) => {
	const verifyIdentityAction = useAction(verifyCurrentClerkIdentity, {
		onSuccess: () => {
			toast.success(
				`Identidade confirmada no ambiente ${environment === 'development' ? 'de desenvolvimento' : 'de produção'}!`,
			);
		},
		onError: (err) => {
			console.error({ err });
			toast.error('Não foi possível verificar a identidade atual.');
		},
	});

	return (
		<div className='flex flex-col gap-4'>
			<h1 className='text-2xl font-bold'>Identidade Clerk</h1>
			<p>
				Ambiente atual: <strong>{environment === 'development' ? 'Desenvolvimento' : 'Produção'}</strong>
			</p>

			<Button
				className='w-full lg:w-80'
				onClick={() => verifyIdentityAction.execute({})}
				disabled={verifyIdentityAction.isPending}
			>
				{verifyIdentityAction.isPending ? <Loader2Icon className='animate-spin' /> : <LinkIcon />}
				Verificar identidade deste ambiente
			</Button>
		</div>
	);
};

export default AdminFormClient;
