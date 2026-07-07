import { Editor, useEditorState } from '@tiptap/react';
import {
	AlignCenterIcon,
	AlignLeftIcon,
	AlignRightIcon,
	BoldIcon,
	Heading1Icon,
	Heading2Icon,
	ItalicIcon,
	ListIcon,
	ListOrderedIcon,
	TypeIcon,
} from 'lucide-react';
import { ToolbarButton } from '../form/text-editor-form';

const EditorToolbar = ({ editor }: { editor: Editor }) => {
	const state = useEditorState({
		editor,
		selector: ({ editor }) => ({
			h1: editor.isActive('heading', { level: 1 }),
			h2: editor.isActive('heading', { level: 2 }),
			paragraph: editor.isActive('paragraph'),

			bold: editor.isActive('bold'),
			italic: editor.isActive('italic'),

			bulletList: editor.isActive('bulletList'),
			orderedList: editor.isActive('orderedList'),

			alignLeft: editor.isActive({ textAlign: 'left' }),
			alignCenter: editor.isActive({ textAlign: 'center' }),
			alignRight: editor.isActive({ textAlign: 'right' }),
		}),
	});

	return (
		<div className='flex flex-wrap items-center gap-0.5 border-b bg-zinc-50 p-1 dark:bg-zinc-900'>
			{/* HEADINGS */}
			{/* <ToolbarButton
				onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
				active={state.h1}
			>
				<Heading1Icon className='h-4 w-4' />
			</ToolbarButton>

			<ToolbarButton
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				active={state.h2}
			>
				<Heading2Icon className='h-4 w-4' />
			</ToolbarButton>

			<ToolbarButton
				onClick={() => editor.chain().focus().setParagraph().run()}
				active={state.paragraph}
			>
				<TypeIcon className='h-4 w-4' />
			</ToolbarButton> */}

			{/* <div className='mx-1 h-4 w-px bg-zinc-300 dark:bg-zinc-700' /> */}

			{/* FORMATAÇÃO */}
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBold().run()}
				active={state.bold}
			>
				<BoldIcon className='h-4 w-4' />
			</ToolbarButton>

			<ToolbarButton
				onClick={() => editor.chain().focus().toggleItalic().run()}
				active={state.italic}
			>
				<ItalicIcon className='h-4 w-4' />
			</ToolbarButton>

			<div className='mx-1 h-4 w-px bg-zinc-300 dark:bg-zinc-700' />

			{/* LISTAS */}
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBulletList().run()}
				active={state.bulletList}
			>
				<ListIcon className='h-4 w-4' />
			</ToolbarButton>

			<ToolbarButton
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
				active={state.orderedList}
			>
				<ListOrderedIcon className='h-4 w-4' />
			</ToolbarButton>

			<div className='mx-1 h-4 w-px bg-zinc-300 dark:bg-zinc-700' />

			{/* ALINHAMENTO */}
			<ToolbarButton
				onClick={() => editor.chain().focus().setTextAlign('left').run()}
				active={state.alignLeft}
			>
				<AlignLeftIcon className='h-4 w-4' />
			</ToolbarButton>

			<ToolbarButton
				onClick={() => editor.chain().focus().setTextAlign('center').run()}
				active={state.alignCenter}
			>
				<AlignCenterIcon className='h-4 w-4' />
			</ToolbarButton>

			<ToolbarButton
				onClick={() => editor.chain().focus().setTextAlign('right').run()}
				active={state.alignRight}
			>
				<AlignRightIcon className='h-4 w-4' />
			</ToolbarButton>
		</div>
	);
};

export default EditorToolbar;
