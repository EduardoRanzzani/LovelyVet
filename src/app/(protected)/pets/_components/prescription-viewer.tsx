'use client';

import { PetsWithRelations } from '@/api/schema/pets.schema';
import { formatAgeShort } from '@/api/util';
import { GoogleMapsIcon } from '@/components/icons/icon-googlemaps';
import { WhatsappIcon } from '@/components/icons/icon-whatsapp';
import { Button } from '@/components/ui/button';
import { FileIcon } from 'lucide-react';
import Image from 'next/image';

interface PrescriptionViewerProps {
	pet?: PetsWithRelations;
	prescriptionContent: string;
	doctorName: string;
	issuedAt: Date;
}

const PrescriptionViewerClient = ({
	pet,
	prescriptionContent,
	doctorName,
	issuedAt,
}: PrescriptionViewerProps) => {
	const date = issuedAt.toLocaleDateString('pt-BR', {
		day: 'numeric',
		year: 'numeric',
		month: 'long',
		timeZone: 'America/Sao_Paulo',
	});

	return (
		<>
			<style>{`
                @media print {
                    @page { 
                        margin: 0; 
                        size: auto; 
                    }
                    body { 
                        margin: 0; 
                        background: white;
                    }
                    .no-print { 
                        display: none !important; 
                    }
                }
            `}</style>

			<div className='w-full m-2 no-print'>
				<Button
					onClick={() => {
						window.print();
					}}
				>
					<FileIcon /> Download
				</Button>
			</div>

			<div className='bg-white w-[210mm] h-[297mm] p-[15mm] mx-auto my-4 shadow-lg print:shadow-none print:m-0 print:p-[15mm]'>
				<div className='absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] print:opacity-[0.03] z-0 mt-60'>
					<Image
						src={'/logo.png'}
						alt={`Marca d'agua`}
						width={600}
						height={600}
					/>
				</div>

				<div className='h-full relative flex flex-col z-10 p-0 print:p-0'>
					<div className='absolute w-full pointer-events-none -top-14 -left-14'>
						<Image
							src='/paw-decoration.png'
							alt='Decoração topo'
							width={300}
							height={300}
							className='object-contain object-top'
						/>
					</div>

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
							<h2 className='font-normal -mt-1'>SIPEAGRO 18734/2025</h2>
						</div>
					</header>

					<div className='flex flex-col gap-4 mb-10'>
						<div className='flex gap-4'>
							<span className='flex flex-col w-full'>
								<label className='text-sm'>
									{pet?.petTutors[0]?.tutor.user.name}
								</label>
								<label className='border-t border-zinc-900 w-full text-xs font-semibold'>
									Tutor
								</label>
							</span>

							<span className='flex flex-col w-full'>
								<label className='text-sm'>{pet?.name}</label>
								<label className='border-t border-zinc-900 w-full text-xs font-semibold'>
									Paciente
								</label>
							</span>
						</div>

						<div className='flex gap-4'>
							<span className='flex flex-col w-full'>
								<label className='text-sm'>{pet?.breed.specie.name}</label>
								<label className='border-t border-zinc-900 w-full text-xs font-semibold'>
									Espécie
								</label>
							</span>

							<span className='flex flex-col w-full'>
								<label className='text-sm'>{pet?.breed.name}</label>
								<label className='border-t border-zinc-900 w-full text-xs font-semibold'>
									Raça
								</label>
							</span>

							<span className='flex flex-col w-full'>
								<label className='text-sm'>
									{formatAgeShort(new Date(pet?.birthDate || ''))}
								</label>
								<label className='border-t border-zinc-900 w-full text-xs font-semibold'>
									Idade
								</label>
							</span>

							<span className='flex flex-col w-full'>
								<label className='text-sm'>{pet?.weightInGrams ?? `---`}</label>
								<label className='border-t border-zinc-900 w-full text-xs font-semibold'>
									Peso
								</label>
							</span>

							<span className='flex flex-col w-full'>
								<label className='text-sm'>
									{pet?.gender === 'female' ? 'Fêmea' : 'Macho'}
								</label>
								<label className='border-t border-zinc-900 w-full text-xs font-semibold'>
									Sexo
								</label>
							</span>
						</div>
					</div>

					<main className='grow min-h-100'>
						<div className='flex flex-col justify-center'>
							<h1 className='text-4xl font-bold mb-8 text-center'>
								Receituário
							</h1>

							<div className='flex flex-col gap-8 w-full max-w-3xl mx-auto p-4 text-xs'>
								<div
									dangerouslySetInnerHTML={{ __html: prescriptionContent }}
									className='prescription-content-rendered'
								/>
							</div>
						</div>
					</main>

					<footer className='flex flex-col gap-10 mb-0'>
						<div className='flex items-center gap-1 w-full'>
							Campo Grande,
							<span>{date}</span>
						</div>

						<div className='flex flex-col gap-2 text-xs'>
							<div className='flex items-center gap-2'>
								<GoogleMapsIcon className='w-4 h-4' />
								Rua Celita Lage Brandão, 184. Jd. Itamaracá - Campo Grande/MS
							</div>
							<div className='flex items-center gap-2'>
								<WhatsappIcon className='w-4 h-4' />
								(67) 99120-1007
							</div>
						</div>
					</footer>

					<div className='flex absolute w-full pointer-events-none -bottom-13 -right-13 justify-end'>
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

			<style>{`
                .prescription-content-rendered .prescription-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid #e5e7eb;
                }

                .prescription-content-rendered .prescription-item:last-child {
                    border-bottom: none;
                }

                .prescription-content-rendered .item-header {
                    display: flex;
                    align-items: flex-end;
                    gap: 0.5rem;
                }

                .prescription-content-rendered .item-name {
                    font-weight: bold;
                    white-space: nowrap;
                }

                .prescription-content-rendered .item-pharmacy {
                    font-weight: bold;
                    white-space: nowrap;
                    font-size: 0.875rem;
                    color: #666;
                }

                .prescription-content-rendered .item-quantity {
                    font-weight: bold;
                    white-space: nowrap;
                }

                .prescription-content-rendered .item-header > div {
                    flex: 1;
                    border-bottom: 1px solid black;
                    margin-bottom: 0.25rem;
                }

                .prescription-content-rendered .item-orientations {
                    font-size: 0.75rem;
                    line-height: 1.5;
                }
            `}</style>
		</>
	);
};

export default PrescriptionViewerClient;
