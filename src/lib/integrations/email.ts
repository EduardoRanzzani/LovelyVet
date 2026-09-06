import {
	ActionResponse,
	EmailSchema,
	emailSchema,
} from '@/api/schema/emails.schema';
import { escapeHtml } from '@/lib/security/html';
import nodemailer from 'nodemailer';
import path from 'path';

export const sendEmailMessage = async (
	data: EmailSchema,
): Promise<ActionResponse> => {
	const parsed = emailSchema.parse(data);

	const mailUser = process.env.EMAIL_USER;
	const mailPass = process.env.EMAIL_PASS;

	if (!mailUser || !mailPass) {
		console.error('Configuração de e-mail ausente');

		return {
			success: false,
			message: 'Serviço de e-mail indisponível',
		};
	}

	const imagePath = path.join(process.cwd(), 'public', 'logo.png');

	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: mailUser,
			pass: mailPass,
		},
	});

	const safeBody = escapeHtml(parsed.body).replace(/\r?\n/g, '<br>');

	try {
		await transporter.sendMail({
			from: `"LovelyVet - Dra. Regina de Oliveira Maciel" <${mailUser}>`,
			to: parsed.to,
			subject: parsed.subject,
			html: `
				<div style='width: 100%; max-width: 600px; font-family: sans-serif; border: 1px solid #eee; border-radius: 1em; overflow: hidden;'>
					<div style='padding: 20px; text-align: center; background-color: #ffffff;'>
						<div style='margin-bottom: 20px;'>
							<img
								src="cid:logo_lovelyvet"
								alt="Logo"
								style='width: 150px; height: auto;'
							/>
						</div>

						<div style='text-align: left; color: #333; line-height: 1.6;'>
							<p>${safeBody}</p>
						</div>
					</div>
				</div>
			`,
			attachments: [
				{
					filename: 'logo.png',
					path: imagePath,
					cid: 'logo_lovelyvet',
				},
			],
		});

		return {
			success: true,
			message: 'Email enviado com sucesso!',
		};
	} catch (error) {
		console.error(
			'Falha ao enviar e-mail:',
			error instanceof Error ? error.message : 'erro desconhecido',
		);

		return {
			success: false,
			message: 'Erro ao enviar email',
		};
	}
};
