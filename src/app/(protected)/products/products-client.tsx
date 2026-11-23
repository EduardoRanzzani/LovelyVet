'use client';
import { saveProduct } from '@/api/actions/products.actions';
import { formatCurrencyFromCents } from '@/helpers/currency';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { toast } from 'sonner';

type Product = { id: string; name: string; priceInCents: number; active: boolean };
export default function ProductsClient({ products }: { products: Product[] }) {
	const [id, setId] = useState<string | undefined>();
	const [name, setName] = useState('');
	const [price, setPrice] = useState('0.00');
	const [active, setActive] = useState(true);
	const action = useAction(saveProduct, {
		onSuccess: () => { toast.success('Produto salvo'); setId(undefined); setName(''); setPrice('0.00'); setActive(true); },
		onError: ({ error }) => toast.error(error.serverError ?? 'Erro ao salvar produto'),
	});
	return <div className='space-y-5'>
		<form className='grid gap-3 rounded-lg border p-4 sm:grid-cols-4' onSubmit={(event) => {
			event.preventDefault();
			const cents = Math.round(Number(price.replace(',', '.')) * 100);
			if (!Number.isSafeInteger(cents) || cents < 0) { toast.error('Preço inválido'); return; }
			action.execute({ id, name, priceInCents: cents, active });
		}}>
			<label className='space-y-1 text-sm sm:col-span-2'>Nome<input required minLength={2} maxLength={120} className='w-full rounded-md border bg-background p-2' value={name} onChange={(e) => setName(e.target.value)} /></label>
			<label className='space-y-1 text-sm'>Preço (R$)<input required type='number' min='0' step='0.01' className='w-full rounded-md border bg-background p-2' value={price} onChange={(e) => setPrice(e.target.value)} /></label>
			<div className='flex flex-col justify-end gap-2'><label className='flex gap-2 text-sm'><input type='checkbox' checked={active} onChange={(e) => setActive(e.target.checked)} /> Ativo</label><button className='rounded-md bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50' disabled={action.isPending} type='submit'>Salvar</button></div>
		</form>
		<div className='divide-y rounded-md border'>{products.map((product) => <div key={product.id} className='flex flex-wrap items-center justify-between gap-3 p-3'><span>{product.name} · {formatCurrencyFromCents(product.priceInCents)} {product.active ? '' : '(Inativo)'}</span><button className='rounded-md border px-3 py-2 text-sm' onClick={() => { setId(product.id); setName(product.name); setPrice((product.priceInCents / 100).toFixed(2)); setActive(product.active); }}>Editar</button></div>)}</div>
	</div>;
}
