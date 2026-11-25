import { getProducts } from '@/api/actions/products.actions';
import { requirePageAccess } from '@/lib/security/authorization';
import ProductsClient from './products-client';
export default async function ProductsPage() {
	await requirePageAccess('/products');
	const products = await getProducts();
	return (
		<main className='mx-auto max-w-4xl space-y-5 p-4 sm:p-8'>
			<h1 className='text-2xl font-semibold'>Catálogo de produtos</h1>
			<p className='text-sm text-muted-foreground'>
				Produtos usados em atendimentos. Os preços já registrados não mudam ao editar o catálogo.
			</p>
			<ProductsClient products={products} />
		</main>
	);
}
