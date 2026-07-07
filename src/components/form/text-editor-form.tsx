'use client';
import { Field } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import TextAlign from '@tiptap/extension-text-align'; // Importante para o align
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import EditorToolbar from '../shared/editor-toolbar';
import { Button } from '../ui/button';

// ... (PRESCRIPTION_VARIABLES permanecem iguais)
// const PRESCRIPTION_VARIABLES = [
// 	{ label: 'Pet', value: '{{nome_pet}}' },
// 	{ label: 'Tutor', value: '{{nome_tutor}}' },
// 	{ label: 'Espécie', value: '{{especie}}' },
// 	{ label: 'Raça', value: '{{raca}}' },
// 	{ label: 'Peso', value: '{{peso}}' },
// 	{ label: 'Data', value: '{{data_hoje}}' },
// ];

interface EditorFormProps<T extends FieldValues> {
	label: string;
	name: Path<T>;
	control: Control<T>;
	error?: string;
	required?: boolean;
	className?: string;
	placeholder?: string;
}

const EditorForm = <T extends FieldValues>({
	label,
	name,
	control,
	error,
	required,
	className,
	placeholder,
}: EditorFormProps<T>) => {
	return (
		<Field className={cn('flex flex-col gap-1', className)}>
			<Label className='text-xs font-medium'>
				{label} {required && <span className='text-destructive'>*</span>}
			</Label>

			<Controller
				name={name}
				control={control}
				render={({ field: { onChange, value } }) => (
					<TiptapEditor
						content={value}
						onChange={onChange}
						placeholder={placeholder}
						hasError={!!error}
					/>
				)}
			/>

			{error && <p className='text-xs text-destructive'>{error}</p>}
		</Field>
	);
};

const TiptapEditor = ({
	content,
	onChange,
	hasError,
}: {
	content: string;
	onChange: (content: string) => void;
	hasError: boolean;
	placeholder?: string;
}) => {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				// Garante que as listas básicas funcionem
				bulletList: { keepAttributes: true, keepMarks: true },
				orderedList: { keepAttributes: true, keepMarks: true },
			}),
			TextAlign.configure({
				types: ['heading', 'paragraph'],
				alignments: ['left', 'center', 'right'],
			}),
		],
		content: content,
		immediatelyRender: false,
		onUpdate: ({ editor }) => {
			const html = editor.getHTML();
			onChange(html === '<p></p>' ? '' : html);
		},
		editorProps: {
			attributes: {
				// Adicionamos 'list-disc' e 'list-decimal' via prose-li para garantir que as listas apareçam
				class: cn(
					'prose prose-sm dark:prose-invert max-w-full w-full break-words min-h-[200px] max-h-[400px] overflow-y-auto rounded-b-md bg-background px-3 py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 marker:text-primary',
					hasError ? 'border-destructive' : '',
				),
			},
		},
	});

	useEffect(() => {
		if (!editor) return;

		if (editor.getHTML() !== (content || '')) {
			editor.commands.setContent(content || '', {
				emitUpdate: false,
			});
		}
	}, [content, editor]);

	if (!editor) return null;

	const addVariable = (value: string) => {
		editor.chain().focus().insertContent(value).run();
	};

	return (
		<div className='flex flex-col w-full min-w-0 overflow-hidden rounded-md border border-input shadow-sm'>
			{/* TOOLBAR PRINCIPAL */}
			{/* <div className='flex flex-wrap items-center gap-0.5 border-b bg-zinc-50 p-1 dark:bg-zinc-900'>
				<ToolbarButton
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 1 }).run()
					}
					active={editor.isActive('heading', { level: 1 })}
				>
					<Heading1 className='h-4 w-4' />
				</ToolbarButton>

				<ToolbarButton
					onClick={() =>
						editor.chain().focus().toggleHeading({ level: 2 }).run()
					}
					active={editor.isActive('heading', { level: 2 })}
				>
					<Heading2 className='h-4 w-4' />
				</ToolbarButton>

				<ToolbarButton
					onClick={() => editor.chain().focus().setParagraph().run()}
					active={editor.isActive('paragraph')}
				>
					<Type className='h-4 w-4' />
				</ToolbarButton>

				<div className='mx-1 h-4 w-px bg-zinc-300 dark:bg-zinc-700' />

				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBold().run()}
					active={editor.isActive('bold')}
				>
					<Bold className='h-4 w-4' />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleItalic().run()}
					active={editor.isActive('italic')}
				>
					<Italic className='h-4 w-4' />
				</ToolbarButton>

				<div className='mx-1 h-4 w-px bg-zinc-300 dark:bg-zinc-700' />

				<ToolbarButton
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					active={editor.isActive('bulletList')}
				>
					<List className='h-4 w-4' />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					active={editor.isActive('orderedList')}
				>
					<ListOrdered className='h-4 w-4' />
				</ToolbarButton>

				<div className='mx-1 h-4 w-px bg-zinc-300 dark:bg-zinc-700' />

				<ToolbarButton
					onClick={() => editor.chain().focus().setTextAlign('left').run()}
					active={editor.isActive({ textAlign: 'left' })}
				>
					<AlignLeft className='h-4 w-4' />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().setTextAlign('center').run()}
					active={editor.isActive({ textAlign: 'center' })}
				>
					<AlignCenter className='h-4 w-4' />
				</ToolbarButton>
				<ToolbarButton
					onClick={() => editor.chain().focus().setTextAlign('right').run()}
					active={editor.isActive({ textAlign: 'right' })}
				>
					<AlignRight className='h-4 w-4' />
				</ToolbarButton>
			</div> */}
			<EditorToolbar editor={editor} />

			{/* VARIÁVEIS */}
			{/* <div className='flex flex-wrap items-center gap-1.5 border-b bg-white p-1.5 dark:bg-zinc-950'>
				<div className='flex items-center gap-1 px-1 mr-1 border-r pr-2'>
					<Tag className='h-3 w-3 text-muted-foreground' />
					<span className='text-[10px] font-bold uppercase text-muted-foreground'>
						Tags
					</span>
				</div>
				{PRESCRIPTION_VARIABLES.map((v) => (
					<button
						key={v.value}
						type='button'
						onClick={() => addVariable(v.value)}
						className='px-2 py-0.5 rounded-full border bg-zinc-50 dark:bg-zinc-900 hover:border-primary hover:text-primary transition-all text-[11px] font-medium'
					>
						{v.label}
					</button>
				))}
			</div> */}

			<EditorContent editor={editor} className='w-full min-w-0' />
		</div>
	);
};

export const ToolbarButton = ({
	children,
	onClick,
	active,
}: {
	children: React.ReactNode;
	onClick: () => void;
	active: boolean;
}) => (
	<Button
		type='button'
		size={'icon-xs'}
		variant={'outline'}
		onClick={onClick}
		className={cn(
			'rounded p-1.5 transition-colors hover:bg-accent dark:hover:bg-zinc-800',
			active && 'bg-primary text-dark dark:bg-zinc-800',
		)}
	>
		{children}
	</Button>
);

export default EditorForm;
