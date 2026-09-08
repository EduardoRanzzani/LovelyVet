'use client';

import { WhatsappIcon } from '@/components/icons/icon-whatsapp';
import { sanitizeRichTextHtml } from '@/lib/security/html';
import Image from 'next/image';
import type { RefObject } from 'react';
import type { PrescriptionDraftItem } from './prescription-builder';

export interface PrescriptionPatientData {
	name: string;
	species: string;
	breed: string;
	age: string;
	weight: string;
	sex: string;
	date: string;
}

interface PrescriptionPreviewProps {
	printRef: RefObject<HTMLDivElement | null>;
	patient: PrescriptionPatientData;
	tutorName: string;
	items: PrescriptionDraftItem[];
	administrationRoute: string;
}

export default function PrescriptionPreview({
	printRef,
	patient,
	tutorName,
	items,
	administrationRoute,
}: PrescriptionPreviewProps) {
	return (
		<div className='overflow-auto rounded-xl border bg-muted/40 p-4'>
			<div
				ref={printRef}
				className='prescription-print-area relative mx-auto aspect-210/297 w-full max-w-[210mm] overflow-hidden bg-white shadow-lg'
			>
				<div className='relative flex h-full flex-col px-[18mm] pb-[12mm] pt-[8mm] text-black'>
					{/* Marca d'água */}
					<div className='absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] print:opacity-[0.03] z-0 mt-60'>
						<Image
							src={'/logo.png'}
							alt={`Marca d'agua`}
							width={600}
							height={600}
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
					<header className='text-center pb-6 mb-4'>
						<div className='flex items-center justify-center'>
							<Image
								src={'/logo.png'}
								alt='logo'
								width={100}
								height={100}
								draggable={false}
							/>
						</div>
						<div className='flex flex-col'>
							<h1 className='font-semibold text-xl'>
								Dra. Regina de Oliveira Maciel
							</h1>
							<h2 className='font-normal -mt-1'>
								Médica Veterinária CRMV/MS 9193
							</h2>
							<h2 className='font-normal -mt-1'>SIPEAGRO MV00802562025</h2>
						</div>
					</header>

					{/* Tutor / paciente */}
					<section className='relative z-10 space-y-[2%]'>
						<div className='grid grid-cols-2 gap-[4%]'>
							<InfoLine value={tutorName} label='Tutor' />
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

						<div className='space-y-[5%]'>
							{items.length === 0 ? (
								<p className='text-center text-sm text-zinc-400'>
									Adicione os medicamentos para visualizar a receita.
								</p>
							) : (
								items.map((item, index) => (
									<div
										key={`${item.sourceId ?? 'custom'}-${index}`}
										className='space-y-1'
									>
										<div className='grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 text-[11px]'>
											{/* Medicamento + linha esquerda */}
											<div className='flex min-w-0 items-end gap-2'>
												<strong className='shrink-0 whitespace-nowrap'>
													{item.name || 'Medicamento'}
												</strong>

												<div className='mb-0.75 min-w-4 flex-1 border-b border-black' />
											</div>

											{/* Farmácia sempre centralizada */}
											<span className='whitespace-nowrap text-center'>
												({item.pharmacy || 'Farm. veterinária'})
											</span>

											{/* Linha direita + quantidade */}
											<div className='flex min-w-0 items-end gap-2'>
												<div className='mb-0.75 min-w-4 flex-1 border-b border-black' />

												<strong className='shrink-0 whitespace-nowrap'>
													{item.quantity || '---'}
												</strong>
											</div>
										</div>

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
					<footer className='flex flex-col gap-10 mb-0'>
						<div className='mb-[5%] flex justify-end'>
							<div className='text-center text-sm'>
								<p className='font-semibold'>M.V. Regina de Oliveira Maciel</p>
								<p>CRMV/MS 9193</p>
								<p>SIPEAGRO MV00802562025</p>
							</div>
						</div>

						<div className='flex items-center gap-1 w-full'>
							Campo Grande,
							<span>{patient.date}</span>
						</div>

						<div className='flex flex-col gap-2'>
							{/* <div className='flex items-center gap-2'>
								<GoogleMapsIcon className='w-4 h-4' />
								Rua Celita Lage Brandão, 184. Jd. Itamaracá - Campo Grande/MS
							</div> */}
							<div className='flex items-center gap-2'>
								<WhatsappIcon className='w-4 h-4' />
								(67) 99120-1007
							</div>
						</div>
					</footer>

					{/* Decoração de Patas - Rodapé */}
					<div className='flex absolute w-[30%] pointer-events-none bottom-0 right-0 justify-end'>
						<Image
							src='/paw-decoration.png'
							alt='Decoração rodapé'
							width={300}
							height={300}
							className='object-contain object-bottom'
						/>
					</div>
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
