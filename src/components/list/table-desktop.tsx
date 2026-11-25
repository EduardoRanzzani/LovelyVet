import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableProps } from './table-responsive';

const TableDesktop = <T,>({
	columns,
	renderRow,
	data,
	emptyMessage = 'Nenhum registro encontrado...',
}: TableProps<T>) => {
	return (
		<div className='overflow-hidden rounded-md border'>
			<Table>
				<TableHeader>
					<TableRow>
						{columns.map((column) => {
							return <TableHead key={column.accessorKey}>{column.header}</TableHead>;
						})}
					</TableRow>
				</TableHeader>
				<TableBody>
					{data && data.length > 0 ? (
						data.map((item) => renderRow(item))
					) : (
						<TableRow>
							<TableCell colSpan={columns.length} className='text-center text-sm p-2 italic'>
								{emptyMessage}
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
};

export default TableDesktop;
