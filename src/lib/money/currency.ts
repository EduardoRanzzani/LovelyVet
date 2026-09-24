const MAX_SAFE_CURRENCY_VALUE = Number.MAX_SAFE_INTEGER / 100;

export const toCents = (value: number): number => {
	if (!Number.isFinite(value)) {
		throw new Error('Valor monetário inválido.');
	}

	if (value < 0) {
		throw new Error('O valor monetário não pode ser negativo.');
	}

	if (value > MAX_SAFE_CURRENCY_VALUE) {
		throw new Error('Valor monetário excede o limite permitido.');
	}

	const cents = Math.round(value * 100);

	if (!Number.isSafeInteger(cents)) {
		throw new Error('Valor monetário inválido.');
	}

	return cents;
};

export const fromCents = (value: number): number => {
	if (!Number.isSafeInteger(value)) {
		throw new Error('Valor em centavos inválido.');
	}

	if (value < 0) {
		throw new Error('O valor em centavos não pode ser negativo.');
	}

	return value / 100;
};
