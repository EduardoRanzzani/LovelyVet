import { Editor, useEditorState } from '@tiptap/react';
import {
	AlignCenterIcon,
	AlignJustifyIcon,
	AlignLeftIcon,
	AlignRightIcon,
	BoldIcon,
	ItalicIcon,
	ListIcon,
	ListOrderedIcon,
	MinusIcon,
	PlusIcon,
	Redo2Icon,
	RotateCcwIcon,
	Undo2Icon,
} from 'lucide-react';
import { ToolbarButton } from '../form/text-editor-form';

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 22, 24];

const EditorToolbar = ({ editor }: { editor: Editor }) => {
	const state = useEditorState({
		editor,
		selector: ({ editor }) => ({
			bold: editor.isActive('bold'),
			italic: editor.isActive('italic'),

			bulletList: editor.isActive('bulletList'),
			orderedList: editor.isActive('orderedList'),

			alignLeft: editor.isActive({ textAlign: 'left' }),
			alignCenter: editor.isActive({ textAlign: 'center' }),
			alignRight: editor.isActive({ textAlign: 'right' }),
			alignJustify: editor.isActive({ textAlign: 'justify' }),

			fontSize: editor.getAttributes('textStyle').fontSize as
				| string
				| undefined,

			canUndo: editor.can().undo(),
			canRedo: editor.can().redo(),
		}),
	});

	const currentSize = Number.parseInt(state.fontSize ?? '14px', 10);

	const changeFontSize = (direction: 'increase' | 'decrease') => {
		const nextSize =
			direction === 'increase'
				? FONT_SIZES.find((size) => size > currentSize)
				: [...FONT_SIZES].reverse().find((size) => size < currentSize);

		if (!nextSize) return;

		editor.chain().focus().setFontSize(`${nextSize}px`).run();
	};

	return (
		<div className='flex flex-wrap items-center gap-1 border-b bg-muted/50 p-2'>
			{/* Desfazer / Refazer */}
			<ToolbarButton
				title='Desfazer'
				onClick={() => editor.chain().focus().undo().run()}
				disabled={!state.canUndo}
			>
				<Undo2Icon className='size-4' />
			</ToolbarButton>

			<ToolbarButton
				title='Refazer'
				onClick={() => editor.chain().focus().redo().run()}
				disabled={!state.canRedo}
			>
				<Redo2Icon className='size-4' />
			</ToolbarButton>

			<div className='mx-1 h-5 w-px bg-border' />

			{/* Tamanho da fonte */}
			<ToolbarButton
				title='Diminuir fonte'
				disabled={currentSize <= FONT_SIZES[0]}
				onClick={() => changeFontSize('decrease')}
			>
				<MinusIcon className='size-4' />
			</ToolbarButton>

			<span className='min-w-12 text-center text-xs font-medium tabular-nums'>
				{currentSize}px
			</span>

			<ToolbarButton
				title='Aumentar fonte'
				disabled={currentSize >= FONT_SIZES[FONT_SIZES.length - 1]}
				onClick={() => changeFontSize('increase')}
			>
				<PlusIcon className='size-4' />
			</ToolbarButton>

			<ToolbarButton
				title='Restaurar tamanho padrão'
				onClick={() => editor.chain().focus().unsetFontSize().run()}
			>
				<RotateCcwIcon className='size-4' />
			</ToolbarButton>

			<div className='mx-1 h-5 w-px bg-border' />

			{/* Formatação */}
			<ToolbarButton
				title='Negrito'
				active={state.bold}
				onClick={() => editor.chain().focus().toggleBold().run()}
			>
				<BoldIcon className='size-4' />
			</ToolbarButton>

			<ToolbarButton
				title='Itálico'
				active={state.italic}
				onClick={() => editor.chain().focus().toggleItalic().run()}
			>
				<ItalicIcon className='size-4' />
			</ToolbarButton>

			<div className='mx-1 h-5 w-px bg-border' />

			{/* Listas */}
			<ToolbarButton
				title='Lista com marcadores'
				active={state.bulletList}
				onClick={() => editor.chain().focus().toggleBulletList().run()}
			>
				<ListIcon className='size-4' />
			</ToolbarButton>

			<ToolbarButton
				title='Lista numerada'
				active={state.orderedList}
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
			>
				<ListOrderedIcon className='size-4' />
			</ToolbarButton>

			<div className='mx-1 h-5 w-px bg-border' />

			{/* Alinhamento */}
			<ToolbarButton
				title='Alinhar à esquerda'
				active={state.alignLeft}
				onClick={() => editor.chain().focus().setTextAlign('left').run()}
			>
				<AlignLeftIcon className='size-4' />
			</ToolbarButton>

			<ToolbarButton
				title='Centralizar'
				active={state.alignCenter}
				onClick={() => editor.chain().focus().setTextAlign('center').run()}
			>
				<AlignCenterIcon className='size-4' />
			</ToolbarButton>

			<ToolbarButton
				title='Alinhar à direita'
				active={state.alignRight}
				onClick={() => editor.chain().focus().setTextAlign('right').run()}
			>
				<AlignRightIcon className='size-4' />
			</ToolbarButton>

			<ToolbarButton
				title='Justificar texto'
				active={state.alignJustify}
				onClick={() => editor.chain().focus().setTextAlign('justify').run()}
			>
				<AlignJustifyIcon className='size-4' />
			</ToolbarButton>
		</div>
	);
};

export default EditorToolbar;
