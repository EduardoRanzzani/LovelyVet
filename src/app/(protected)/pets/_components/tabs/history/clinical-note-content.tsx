import { sanitizeRichTextHtml } from '@/lib/security/html';

export default function ClinicalNoteContent({ content }: { content: string }) {
	return (
		<div
			className='rich-text-content min-w-0 max-w-none'
			dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(content) }}
		/>
	);
}
