export const generateUsername = (name: string): string => {
	const nameParts = name.trim().toLowerCase().split(/\s+/);

	// Remove conectores comuns em nomes brasileiros
	const conectores = ['de', 'da', 'do', 'das', 'dos'];
	const filteredParts = nameParts.filter((part) => !conectores.includes(part));

	const firstName = filteredParts[0];
	const lastName =
		filteredParts.length > 1 ? filteredParts[filteredParts.length - 1] : '';

	const generatedUsername = lastName ? `${firstName}${lastName}` : firstName;

	return generatedUsername;
};

export const getInitials = (name: string): string => {
	const words = name.trim().split(/\s+/);
	const first = words[0][0].toUpperCase();
	const last = words.length > 1 ? words[words.length - 1][0].toUpperCase() : '';
	return first + last;
};

export const formatAge = (dateOfBirth: Date): string => {
	const today = new Date();
	let years = today.getFullYear() - dateOfBirth.getFullYear();
	let months = today.getMonth() - dateOfBirth.getMonth();
	let days = today.getDate() - dateOfBirth.getDate();

	// Se o mês atual for antes do mês de nascimento, ajusta os anos e meses
	if (months < 0) {
		years--;
		months += 12;
	}

	// Verifica se o dia do mês já passou, se não, ajusta os meses
	if (today.getDate() < dateOfBirth.getDate()) {
		months--;
		if (months < 0) {
			years--;
			months += 12;
		}
	}

	if (days < 0) {
		const lastMonth = new Date(
			today.getFullYear(),
			today.getMonth(),
			0,
		).getDate();
		days += lastMonth;
	}

	const textYears = `${
		years < 1 ? '' : years === 1 ? '1 ano' : `${years} anos`
	}`;
	const textMonths = `${
		months < 1 ? '' : months === 1 ? '1 mês' : `${months} meses`
	}`;
	const textDays = `${days < 1 ? '' : days === 1 ? '1 dia' : `${days} dias`}`;

	let result = '';

	if (years > 0) {
		result = textYears + (months > 0 ? ` e ${textMonths}` : '');
	} else if (months > 0) {
		result = textMonths + (days > 0 ? ` e ${textDays}` : '');
	} else {
		result = textDays;
	}

	return result;
};

export const formatAgeShort = (dateOfBirth: Date): string => {
	const today = new Date();
	let years = today.getFullYear() - dateOfBirth.getFullYear();
	let months = today.getMonth() - dateOfBirth.getMonth();

	// Ajusta se o mês atual for anterior ao mês de nascimento
	// ou se for o mesmo mês, mas o dia ainda não chegou
	if (months < 0 || (months === 0 && today.getDate() < dateOfBirth.getDate())) {
		years--;
		months = (months + 12) % 12;
	}

	// Ajuste fino para o caso de o dia de hoje ser menor que o dia de nascimento
	if (today.getDate() < dateOfBirth.getDate() && months > 0) {
		months--;
	} else if (
		today.getDate() < dateOfBirth.getDate() &&
		months === 0 &&
		years > 0
	) {
		years--;
		months = 11;
	}

	const partYears = years > 0 ? `${years}A` : '';
	const partMonths = months > 0 ? `${months}M` : '';

	// Retorna a combinação, removendo espaços extras se um dos dois for vazio
	return (
		`${partYears}${partYears && partMonths ? ' ' : ''}${partMonths}` || '0M'
	);
};
