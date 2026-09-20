'use client';

import { linkCurrentClerkIdentity } from '@/api/actions/admin.actions';
import { Button } from '@/components/ui/button';
import { LinkIcon, Loader2Icon } from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { toast } from 'sonner';

interface AdminFormClientProps {
	environment: 'development' | 'production';
}

const AdminFormClient = ({ environment }: AdminFormClientProps) => {
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
		</div>
	);
};

export default AdminFormClient;
