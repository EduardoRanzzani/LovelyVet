'use client';

import type { PrescriptionDocumentItem } from '@/api/schema/prescription-document.schema';
import { WhatsappIcon } from '@/components/icons/icon-whatsapp';
import { sanitizeRichTextHtml } from '@/lib/security/html';
import Image from 'next/image';
import type { Ref } from 'react';

export interface PrescriptionDocumentPatient {
	tutorName: string;
	name: string;
	species: string;
	breed: string;
	age: string;
	weight: string;
	sex: string;
	date: string;
}

interface PrescriptionDocumentProps {
	patient: PrescriptionDocumentPatient;
	items: PrescriptionDocumentItem[];
	administrationRoute: string;
	printRef?: Ref<HTMLDivElement>;
}

export default function PrescriptionDocument({
	patient,
	items,
	administrationRoute,
	printRef,
}: PrescriptionDocumentProps) {
	return (
		<div
			ref={printRef}
			className='prescription-print-area relative mx-auto aspect-210/297 w-full max-w-[210mm] overflow-hidden bg-white text-black shadow-lg'
		>
			<div className='relative flex h-full flex-col p-4 px-20 pb-12 text-black'>
				{/* Marca d'água */}
				<div className='pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035]'>
					<Image
						src='/logo.png'
						alt=''
						width={520}
						height={520}
						className='w-[55%] object-contain'
					/>
				</div>

				{/* Patas topo */}
				<div className='pointer-events-none absolute left-[-4] top-[-2] w-[30%]'>
					<Image
						src='/paw-decoration.png'
						alt=''
						width={300}
						height={300}
						className='w-full object-contain'
					/>
				</div>

				{/* Cabeçalho */}
				<header className='relative z-10 mb-[5%] text-center'>
					<Image
						src='/logo.png'
						alt='LovelyVet'
						width={90}
						height={90}
						className='mx-auto mb-1 w-[12%] min-w-16 object-contain'
					/>

					<h1 className='text-[16px] font-semibold'>
						Dra. Regina de Oliveira Maciel
					</h1>

					<p className='text-[11px]'>Médica Veterinária CRMV/MS 9193</p>

					<p className='text-[11px]'>SIPEAGRO MV00802562025</p>
				</header>

				{/* Tutor / paciente */}
				<section className='relative z-10 space-y-[2%]'>
					<div className='grid grid-cols-2 gap-[4%]'>
						<InfoLine value={patient.tutorName} label='Tutor' />

						<InfoLine value={patient.name} label='Paciente' />
					</div>

					<div className='grid grid-cols-5 gap-[2%]'>
						<InfoLine value={patient.species} label='Espécie' />

						<InfoLine value={patient.breed} label='Raça' />

						<InfoLine value={patient.age} label='Idade' />

						<InfoLine value={patient.weight} label='Peso' />

						<InfoLine value={patient.sex} label='Sexo' />
					</div>
				</section>

				{/* Conteúdo */}
				<main className='relative z-10 mt-6 flex-1'>
					<h2 className='mb-2 text-center text-[30px] font-bold'>
						Receituário
					</h2>

					{administrationRoute.trim() && (
						<p className='mb-4 text-center text-[13px] font-semibold uppercase'>
							{administrationRoute}
						</p>
					)}

					<div className='space-y-[3%]'>
						{items.length === 0 ? (
							<p className='text-center text-[11px] text-zinc-400'>
								Nenhum medicamento adicionado.
							</p>
						) : (
							items.map((item, index) => (
								<div
									key={`${item.sourceId ?? 'custom'}-${index}`}
									className='space-y-1'
								>
									{/* Linha medicamento / farmácia / quantidade */}
									<div className='grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 text-[11px]'>
										{/* Nome + linha esquerda */}
										<div className='flex min-w-0 items-end gap-2'>
											<strong className='shrink-0 whitespace-nowrap'>
												{item.name || 'Medicamento'}
											</strong>

											<div className='mb-0.75 min-w-4 flex-1 border-b border-black' />
										</div>

										{/* Farmácia sempre centralizada */}
										<span className='whitespace-nowrap text-center'>
											({item.pharmacy || 'Farmácia veterinária'})
										</span>

										{/* Linha direita + quantidade */}
										<div className='flex min-w-0 items-end gap-2'>
											<div className='mb-0.75 min-w-4 flex-1 border-b border-black' />

											<strong className='shrink-0 whitespace-nowrap'>
												{item.quantity || '---'}
											</strong>
										</div>
									</div>

									{/* Orientações */}
									<div
										className='text-[11px] leading-5'
										dangerouslySetInnerHTML={{
											__html: sanitizeRichTextHtml(item.orientations || ''),
										}}
									/>
								</div>
							))
						)}
					</div>
				</main>

				{/* Rodapé */}
				<footer className='relative z-10'>
					<div className='mb-[5%] flex justify-end'>
						<div className='text-center text-[11px]'>
							<p className='font-semibold'>M.V. Regina de Oliveira Maciel</p>

							<p>CRMV/MS 9193</p>

							<p>SIPEAGRO MV00802562025</p>
						</div>
					</div>

					<p className='mb-[3%] text-[11px]'>Campo Grande, {patient.date}.</p>

					<div className='space-y-1 text-[10px]'>
						<div className='flex items-center gap-2'>
							<WhatsappIcon className='size-4 shrink-0' />

							<span>(67) 99120-1007</span>
						</div>
					</div>
				</footer>

				{/* Patas rodapé */}
				<div className='pointer-events-none absolute bottom-[-2] right-[-4] w-[30%] rotate-180'>
					<Image
						src='/paw-decoration.png'
						alt=''
						width={300}
						height={300}
						className='w-full object-contain'
					/>
				</div>
			</div>
		</div>
	);
}

interface InfoLineProps {
	value: string;
	label: string;
}

function InfoLine({ value, label }: InfoLineProps) {
	return (
		<div className='min-w-0'>
			<p className='truncate text-[11px]'>{value || '-'}</p>

			<div className='border-t border-black' />

			<p className='text-[9px] font-semibold'>{label}</p>
		</div>
	);
}
