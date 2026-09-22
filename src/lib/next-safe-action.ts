import { createSafeActionClient } from 'next-safe-action';

export const actionClient = createSafeActionClient({
	handleServerError(error) {
		console.error('\n[NEXT SAFE ACTION - SERVER ERROR]');

		console.error(error);

		console.error('[/NEXT SAFE ACTION - SERVER ERROR]\n');

		/*
		 * Em desenvolvimento queremos enxergar a causa real.
		 * Em produção continuamos sem expor detalhes internos.
		 */
		if (process.env.NODE_ENV === 'development') {
			return error.message;
		}

		return 'Ocorreu um erro interno ao executar a operação.';
	},
});
