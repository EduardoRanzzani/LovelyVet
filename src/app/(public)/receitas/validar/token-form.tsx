'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PrescriptionTokenForm() {
	const router = useRouter();
	const [token, setToken] = useState('');

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const normalizedToken = token.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

		if (!normalizedToken) return;

		router.push(`/receitas/validar/${normalizedToken}`);
	};

	return (
		<form onSubmit={handleSubmit} className='mt-6 space-y-3'>
			<label htmlFor='validation-token' className='text-sm font-medium'>
				Token da receita
			</label>

			<div className='flex flex-col gap-2 sm:flex-row'>
				<Input
					id='validation-token'
					value={token}
					onChange={(event) => setToken(event.target.value.toUpperCase())}
					placeholder='Informe o token impresso no PDF'
					className='font-mono uppercase'
					autoComplete='off'
				/>

				<Button type='submit' disabled={!token.trim()}>
					Validar receita
				</Button>
			</div>
		</form>
	);
}
