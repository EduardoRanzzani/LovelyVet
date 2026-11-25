'use client';

import { Field } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TextAlign from '@tiptap/extension-text-align';
import { FontSize, TextStyle } from '@tiptap/extension-text-style';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, type ReactNode } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import EditorToolbar from '../shared/editor-toolbar';

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
		<Field className={cn('flex min-w-0 flex-col gap-1', className)}>
			<Label className='text-xs font-medium'>
				{label}
				{required && <span className='text-destructive'> *</span>}
			</Label>

			<Controller
				name={name}
				control={control}
				render={({ field: { onChange, value } }) => (
					<TiptapEditor
						content={value ?? ''}
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

interface TiptapEditorProps {
	content: string;
	onChange: (content: string) => void;
	hasError: boolean;
	placeholder?: string;
}

const TiptapEditor = ({ content, onChange, hasError, placeholder }: TiptapEditorProps) => {
	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				bulletList: {
					keepAttributes: true,
					keepMarks: true,
				},
				orderedList: {
					keepAttributes: true,
					keepMarks: true,
				},
			}),
			TextStyle,
			FontSize,
			TextAlign.configure({
				types: ['heading', 'paragraph'],
				alignments: ['left', 'center', 'right', 'justify'],
			}),
			Placeholder.configure({
				placeholder: placeholder ?? 'Digite seu texto...',
			}),
		],
		content: content || '',
		immediatelyRender: false,
		onUpdate: ({ editor }) => {
			const html = editor.getHTML();
			onChange(html === '<p></p>' ? '' : html);
		},
		editorProps: {
			attributes: {
				class: cn(
					'rich-text-content w-full min-w-0',
					'min-h-[200px] max-h-[400px] overflow-y-auto',
					'break-words bg-background px-3 py-3',
					'text-sm leading-relaxed text-foreground',
					'focus:outline-none',
					hasError && 'border-destructive',
				),
			},
		},
	});

	useEffect(() => {
		if (!editor) return;

		const nextContent = content || '';
		const currentContent = editor.getHTML();

		if (currentContent !== nextContent && !(currentContent === '<p></p>' && nextContent === '')) {
			editor.commands.setContent(nextContent, {
				emitUpdate: false,
			});
		}
	}, [editor, content]);

	if (!editor) return null;

	return (
		<div
			className={cn(
				'flex w-full min-w-0 flex-col overflow-hidden',
				'rounded-md border bg-background shadow-sm',
				hasError ? 'border-destructive' : 'border-input',
			)}
		>
			<EditorToolbar editor={editor} />

			<EditorContent editor={editor} className='w-full min-w-0' />
		</div>
	);
};

interface ToolbarButtonProps {
	children: ReactNode;
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
	title?: string;
}

export const ToolbarButton = ({ children, onClick, active = false, disabled = false, title }: ToolbarButtonProps) => (
	<Button
		type='button'
		size='icon-xs'
		variant='outline'
		title={title}
		aria-label={title}
		aria-pressed={active}
		disabled={disabled}
		onClick={onClick}
		className={cn(
			'rounded p-1.5 transition-colors',
			'hover:bg-accent',
			active && 'bg-accent text-accent-foreground',
		)}
	>
		{children}
	</Button>
);

export default EditorForm;
