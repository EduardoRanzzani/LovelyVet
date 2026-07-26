import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

interface RouteParams {
	params: Promise<{ id: string }> | { id: string };
}

export async function GET(request: NextRequest, context: RouteParams) {
	const resolvedParams = await context.params;
	const prescriptionId = resolvedParams.id;

	try {
		const browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		});

		const page = await browser.newPage();

		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
		const secret =
			process.env.INTERNAL_PDF_SECRET || 'internal-pdf-secret-to-download';

		const targetUrl = `${baseUrl}/prescriptions/print/${prescriptionId}?secret=${secret}`;

		// Garante envio de requisição limpa
		await page.goto(targetUrl, {
			waitUntil: 'networkidle0',
		});

		// Se por algum motivo o Puppeteer cair no login/dashboard, interrompe
		const currentUrl = page.url();
		if (currentUrl.includes('/dashboard') || currentUrl.includes('/sign-in')) {
			await browser.close();
			return NextResponse.json(
				{
					error:
						'Acesso negado à página de impressão. Verifique a chave de autenticação.',
				},
				{ status: 403 },
			);
		}

		const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
		await browser.close();

		const bodyBuffer = Buffer.from(pdfBuffer);

		return new NextResponse(bodyBuffer, {
			status: 200,
			headers: {
				'Content-Type': 'application/pdf',
				'Content-Disposition': `attachment; filename="receita-${prescriptionId}.pdf"`,
			},
		});
	} catch (error: unknown) {
		const errorMessage =
			error instanceof Error ? error.message : 'Falha ao gerar PDF';
		console.error('Erro ao gerar PDF:', errorMessage);

		return NextResponse.json({ error: 'Falha ao gerar PDF' }, { status: 500 });
	}
}

// import { NextRequest, NextResponse } from 'next/server';
// import puppeteer from 'puppeteer';

// interface RouteParams {
// 	params: Promise<{ id: string }> | { id: string };
// }

// export async function GET(request: NextRequest, context: RouteParams) {
// 	const resolvedParams = await context.params;
// 	const prescriptionId = resolvedParams.id;

// 	try {
// 		const browser = await puppeteer.launch({
// 			headless: true,
// 			args: ['--no-sandbox', '--disable-setuid-sandbox'],
// 		});

// 		const page = await browser.newPage();

// 		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
// 		const secret = process.env.INTERNAL_PDF_SECRET || 'chave_secreta_fallback';

// 		const targetUrl = `${baseUrl}/prescriptions/print/${prescriptionId}?secret=${secret}`;

// 		await page.goto(targetUrl, {
// 			waitUntil: 'networkidle0',
// 		});

// 		if (page.url().includes('/dashboard') || page.url().includes('/sign-in')) {
// 			await browser.close();
// 			return NextResponse.json(
// 				{ error: 'Não foi possível acessar a rota de impressão' },
// 				{ status: 403 },
// 			);
// 		}

// 		const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
// 		await browser.close();

// 		// 💡 SOLUÇÃO DO ERRO:
// 		// Convertemos o Uint8Array para um Buffer explícito do Node.js ou fazemos o cast de ArrayBufferView
// 		const bodyBuffer = Buffer.from(pdfBuffer);

// 		return new NextResponse(bodyBuffer, {
// 			status: 200,
// 			headers: {
// 				'Content-Type': 'application/pdf',
// 				'Content-Disposition': `attachment; filename="receita-${prescriptionId}.pdf"`,
// 			},
// 		});
// 	} catch (error: unknown) {
// 		const errorMessage =
// 			error instanceof Error ? error.message : 'Falha ao gerar PDF';
// 		console.error('Erro ao gerar PDF selecionável:', errorMessage);

// 		return NextResponse.json({ error: 'Falha ao gerar PDF' }, { status: 500 });
// 	}
// }
