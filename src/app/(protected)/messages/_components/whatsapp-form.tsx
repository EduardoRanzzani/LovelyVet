'use client';

import { sendWhatsappMessage } from '@/api/actions/whatsapp.actions';
import InputForm from '@/components/form/input-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SendIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import type { WhatsappPayload } from '@/api/schema/whatsapp.schema';

const data = z.object({
	to: z.string().nonempty({ message: "O campo 'destinatário' é obrigatório" }),
	body: z.string().nonempty({ message: "O campo 'corpo' é obrigatório" }),
});

type WhatsappFormData = z.infer<typeof data>;

const WhatsappFormClient = () => {
	const form = useForm<WhatsappFormData>({
		resolver: zodResolver(data),
		defaultValues: {
			to: '',
			body: '',
		},
	});

	const formSubmit = (data: WhatsappFormData) => {
		const payload: WhatsappPayload = {
			number: data.to,
			delay: 1200,
			text: data.body,
			linkPreview: false,
		};

		sendWhatsappMessage(payload);
	};

	return (
		<Card className='w-full lg:w-160'>
			<CardHeader>
				<CardTitle>Envio de Mensagem</CardTitle>
			</CardHeader>

			<CardContent>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(formSubmit)}
						className='flex flex-col gap-5'
					>
						<div className='flex flex-row gap-4'>
							<InputForm
								label='Para:'
								register={form.register}
								name='to'
								error={form.formState.errors.to?.message}
							/>

							<InputForm
								label='Corpo:'
								register={form.register}
								name='body'
								error={form.formState.errors.body?.message}
							/>
						</div>

						<div className='flex justify-end'>
							<Button type='submit' className='w-full lg:w-60'>
								<SendIcon />
								Enviar
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};

export default WhatsappFormClient;
