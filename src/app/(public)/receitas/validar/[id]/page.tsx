import { db } from '@/db';
import { prescriptionSignaturesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { FileCheck2Icon, ShieldAlertIcon, ShieldCheckIcon } from 'lucide-react';
import { createHash } from 'node:crypto';

export const dynamic = 'force-dynamic';

interface PrescriptionValidationPageProps {
	params: Promise<{
		id: string;
	}>;
}

const formatDateTime = (date: Date): string => {
	return new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		timeZone: 'America/Campo_Grande',
	}).format(date);
};

const formatDate = (date: Date): string => {
	return new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		timeZone: 'America/Campo_Grande',
	}).format(date);
};

export default async function PrescriptionValidationPage({
	params,
}: PrescriptionValidationPageProps) {
	const { id } = await params;

	const signature = await db.query.prescriptionSignaturesTable.findFirst({
		where: eq(prescriptionSignaturesTable.id, id),

		with: {
			prescription: true,
		},
	});

	if (!signature) {
		return (
			<main className='min-h-screen px-4 py-10 bg-muted/40'>
				<div className='max-w-2xl mx-auto'>
					<div className='p-6 border shadow-sm rounded-2xl bg-background sm:p-8'>
						<div className='flex items-start gap-4'>
							<div className='flex items-center justify-center rounded-full size-11 shrink-0 bg-destructive/10'>
								<ShieldAlertIcon className='size-6 text-destructive' />
							</div>

							<div className='space-y-2'>
								<h1 className='text-xl font-semibold'>
									Assinatura não encontrada
								</h1>

								<p className='text-sm leading-6 text-muted-foreground'>
									Não foi encontrado nenhum registro de assinatura digital para
									o código informado.
								</p>
							</div>
						</div>

						<div className='p-4 mt-6 border rounded-lg bg-muted/30'>
							<p className='text-xs font-medium text-muted-foreground'>
								Identificador consultado
							</p>

							<p className='mt-1 font-mono text-xs break-all'>{id}</p>
						</div>
					</div>
				</div>
			</main>
		);
	}

	const computedPdfSha256 = createHash('sha256')
		.update(signature.pdf)
		.digest('hex');

	const storedPdfSha256 = signature.pdfSha256.toLowerCase();

	const isPdfIntegrityValid = computedPdfSha256 === storedPdfSha256;

	const signedAt = new Date(signature.signedAt);

	const certificateValidFrom = new Date(signature.certificateValidFrom);

	const certificateValidTo = new Date(signature.certificateValidTo);

	const certificateWasValidAtSigning =
		signedAt >= certificateValidFrom && signedAt <= certificateValidTo;

	const documentData = signature.prescription.documentData;

	const patientName = documentData?.patient?.name ?? 'Não informado';

	const tutorName = documentData?.tutor?.name ?? 'Não informado';

	const integrityOk = isPdfIntegrityValid && certificateWasValidAtSigning;

	return (
		<main className='min-h-screen px-4 py-10 bg-muted/40'>
			<div className='max-w-2xl mx-auto space-y-5'>
				<div className='p-6 border shadow-sm rounded-2xl bg-background sm:p-8'>
					<div className='flex items-start gap-4'>
						<div
							className={
								integrityOk
									? 'flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10'
									: 'flex size-12 shrink-0 items-center justify-center rounded-full bg-destructive/10'
							}
						>
							{integrityOk ? (
								<ShieldCheckIcon className='size-7 text-emerald-600' />
							) : (
								<ShieldAlertIcon className='size-7 text-destructive' />
							)}
						</div>

						<div className='min-w-0 space-y-1'>
							<p className='text-sm font-medium text-muted-foreground'>
								Validação de receita
							</p>

							<h1 className='text-2xl font-semibold'>
								{integrityOk
									? 'Registro de assinatura confirmado'
									: 'Inconsistência encontrada'}
							</h1>

							<p className='text-sm leading-6 text-muted-foreground'>
								{integrityOk
									? 'A receita possui um registro de assinatura digital e o arquivo armazenado corresponde ao hash registrado no momento da assinatura.'
									: 'O registro foi localizado, mas uma das verificações internas de integridade não foi concluída com sucesso.'}
							</p>
						</div>
					</div>
				</div>

				<div className='p-6 border shadow-sm rounded-2xl bg-background'>
					<div className='flex items-center gap-2 mb-5'>
						<FileCheck2Icon className='size-5' />

						<h2 className='font-semibold'>Dados da receita</h2>
					</div>

					<div className='grid gap-5 sm:grid-cols-2'>
						<ValidationField label='Paciente' value={patientName} />

						<ValidationField label='Tutor' value={tutorName} />

						<ValidationField
							label='Tipo'
							value={
								documentData?.isControlled
									? 'Receituário Controlado'
									: 'Receituário'
							}
						/>

						<ValidationField
							label='Assinada em'
							value={formatDateTime(signedAt)}
						/>
					</div>
				</div>

				<div className='p-6 border shadow-sm rounded-2xl bg-background'>
					<h2 className='mb-5 font-semibold'>Certificado digital</h2>

					<div className='space-y-5'>
						<ValidationField
							label='Titular do certificado'
							value={signature.certificateCommonName}
						/>

						<ValidationField
							label='Emissor'
							value={signature.certificateIssuer}
						/>

						<div className='grid gap-5 sm:grid-cols-2'>
							<ValidationField
								label='Válido desde'
								value={formatDate(certificateValidFrom)}
							/>

							<ValidationField
								label='Válido até'
								value={formatDate(certificateValidTo)}
							/>
						</div>

						<ValidationStatus
							label='Certificado dentro da validade na data da assinatura'
							valid={certificateWasValidAtSigning}
						/>
					</div>
				</div>

				<div className='p-6 border shadow-sm rounded-2xl bg-background'>
					<h2 className='mb-5 font-semibold'>Integridade do documento</h2>

					<div className='space-y-5'>
						<ValidationStatus
							label='Hash do PDF armazenado confere'
							valid={isPdfIntegrityValid}
						/>

						<ValidationField
							label='SHA-256'
							value={signature.pdfSha256}
							monospace
						/>

						<ValidationField
							label='Identificador da assinatura'
							value={signature.id}
							monospace
						/>

						<ValidationField
							label='Fingerprint SHA-256 do certificado'
							value={signature.certificateFingerprintSha256}
							monospace
						/>

						<ValidationField
							label='Número de série do certificado'
							value={signature.certificateSerialNumber}
							monospace
						/>
					</div>
				</div>

				<div className='p-4 border rounded-xl bg-background/70'>
					<p className='text-xs leading-5 text-muted-foreground'>
						Esta página confirma o registro da assinatura e a integridade do PDF
						armazenado pelo LovelyVet. A validação criptográfica da cadeia do
						certificado e seu status de confiança também podem ser conferidos em
						um verificador de assinaturas digitais compatível com o PDF.
					</p>
				</div>
			</div>
		</main>
	);
}

interface ValidationFieldProps {
	label: string;
	value: string;
	monospace?: boolean;
}

function ValidationField({
	label,
	value,
	monospace = false,
}: ValidationFieldProps) {
	return (
		<div className='min-w-0'>
			<p className='text-xs font-medium text-muted-foreground'>{label}</p>

			<p
				className={
					monospace
						? 'mt-1 break-all font-mono text-xs leading-5'
						: 'mt-1 wrap-break-word text-sm font-medium'
				}
			>
				{value}
			</p>
		</div>
	);
}

interface ValidationStatusProps {
	label: string;
	valid: boolean;
}

function ValidationStatus({ label, valid }: ValidationStatusProps) {
	return (
		<div className='flex items-center justify-between gap-4 p-3 border rounded-lg'>
			<span className='text-sm'>{label}</span>

			<span
				className={
					valid
						? 'shrink-0 text-xs font-semibold text-emerald-600'
						: 'shrink-0 text-xs font-semibold text-destructive'
				}
			>
				{valid ? 'Confirmado' : 'Falhou'}
			</span>
		</div>
	);
}
