'use client';

import TextEditorForm from '@/components/form/text-editor-form';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';

interface RichTextDocumentForm {
	content: string;
}

interface RichTextDocumentBuilderProps {
	label: string;
	placeholder: string;
	initialContent?: string;
	onContentChange?: (content: string) => void;
}

export default function RichTextDocumentBuilder({
	label,
	placeholder,
	initialContent = '',
	onContentChange,
}: RichTextDocumentBuilderProps) {
	const form = useForm<RichTextDocumentForm>({
		defaultValues: {
			content: initialContent,
		},
	});

	const content = useWatch({
		control: form.control,
		name: 'content',
	});

	useEffect(() => {
		onContentChange?.(content ?? '');
	}, [content, onContentChange]);

	return (
		<div className='space-y-4'>
			<TextEditorForm
				name='content'
				control={form.control}
				label={label}
				placeholder={placeholder}
			/>
		</div>
	);
}
