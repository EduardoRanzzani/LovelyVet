import { ReactNode } from 'react';
import TableDesktop from './table-desktop';
import MobileTable from './table-mobile';

export type TableProps<T> = {
	columns: {
		header: string | ReactNode;
		accessorKey: string;
		className?: string;
	}[];
	emptyMessage?: string;
	renderRow: (item: T) => ReactNode;
	renderMobile?: (item: T) => ReactNode;
	data: T[];
};

const ResponsiveTable = <T,>({ columns, data, emptyMessage, renderRow, renderMobile }: TableProps<T>) => {
	return (
		<div>
			{/* desktop */}
			<div className='hidden xl:block'>
				<TableDesktop columns={columns} data={data} renderRow={renderRow} emptyMessage={emptyMessage} />
			</div>
			{/* mobile */}
			<div className='flex xl:hidden'>
				<MobileTable data={data} renderMobile={renderMobile!} emptyMessage={emptyMessage} />
			</div>
		</div>
	);
};

export default ResponsiveTable;
