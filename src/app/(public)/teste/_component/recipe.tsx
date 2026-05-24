'use client';
import { PetsWithRelations } from '@/api/schema/pets.schema';
import { PrescriptionItemsWithRelations } from '@/api/schema/prescriptions-items.schema';
import { formatAgeShort } from '@/api/util';
import { GoogleMapsIcon } from '@/components/icons/icon-googlemaps';
import { WhatsappIcon } from '@/components/icons/icon-whatsapp';
import { Button } from '@/components/ui/button';
import { FileIcon } from 'lucide-react';
import Image from 'next/image';

interface RecipeLayoutProps {
	pet?: PetsWithRelations;
	prescriptionItems?: PrescriptionItemsWithRelations[];
	recipeDate?: Date;
}

const RecipeLayoutPageClient = ({
	pet,
	prescriptionItems,
	recipeDate,
}: RecipeLayoutProps) => {
	const date =
		recipeDate?.toLocaleDateString('pt-BR', {
			day: 'numeric',
			year: 'numeric',
			month: 'long',
			timeZone: 'America/Sao_Paulo',
		}) ||
		new Date().toLocaleDateString('pt-BR', {
			day: 'numeric',
			year: 'numeric',
			month: 'long',
			timeZone: 'America/Sao_Paulo',
		});

	return (
		<>
			{/* Regras específicas para limpeza da impressão */}
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
				{/* marca dágua central */}
				<div className='absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] print:opacity-[0.03] z-0 mt-60'>
					<Image
						src={'/logo.png'}
						alt={`Marca d'agua`}
						width={600}
						height={600}
					/>
				</div>

				<div className='h-full relative flex flex-col z-10 p-0 print:p-0'>
					{/* Decoração de Patas - Topo */}
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
								{prescriptionItems?.map((item) => (
									<div key={item.id} className='flex flex-col gap-1'>
										<div className='flex items-end w-full gap-1 md:text-base'>
											<span className='font-bold whitespace-nowrap'>
												{item.name}
											</span>

											<div className='flex-1 border-b border-black mb-1' />

											<span className='font-bold whitespace-nowrap'>
												({item.pharmacy})
											</span>

											<div className='flex-1 border-b border-black mb-1' />

											<span className='font-bold whitespace-nowrap'>
												{item.quantity}
											</span>
										</div>

										{/* Linha Inferior: Orientações */}
										<p
											className='text-xs print:text-xs leading-relaxed'
											dangerouslySetInnerHTML={{ __html: item.orientations }}
										/>
									</div>
								))}
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

					{/* Decoração de Patas - Rodapé */}
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
		</>
	);
};

export default RecipeLayoutPageClient;
