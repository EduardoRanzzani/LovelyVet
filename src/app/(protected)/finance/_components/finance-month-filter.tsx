'use client';

import { MonthNavigator } from '@/components/ui/month-navigator';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function FinanceMonthFilter({ selected }: { selected: string }) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const onMonthChange = (month: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('month', month);
		router.push(`${pathname}?${params.toString()}`);
	};

	return <MonthNavigator month={selected} title='Mês de referência' onMonthChange={onMonthChange} />;
}
