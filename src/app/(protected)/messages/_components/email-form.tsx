'use client';

import { sendEmailAction } from '@/api/actions/emails.actions';
import InputForm from '@/components/form/input-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SendIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import z from 'zod';

const data = z.object({
	to: z.string().nonempty({ message: "O campo 'destinatário' é obrigatório" }),
	subject: z.string().nonempty({ message: "O campo 'assunto' é obrigatório" }),
	body: z.string().nonempty({ message: "O campo 'corpo' é obrigatório" }),
});

type EmailFormData = z.infer<typeof data>;

const EmailFormClient = () => {
	const form = useForm<EmailFormData>({
		resolver: zodResolver(data),
		defaultValues: {
			to: '',
			subject: '',
			body: '',
		},
	});

	const formSubmit = (data: EmailFormData) => {
		sendEmailAction(data);
	};

	return (
		<Card className='w-full lg:w-160'>
			<CardHeader>
				<CardTitle>Envio de E-Mail</CardTitle>
			</CardHeader>

			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(formSubmit)} className='flex flex-col gap-5'>
						<div className='flex flex-row gap-4'>
							<InputForm
								label='Para:'
								register={form.register}
								name='to'
								error={form.formState.errors.to?.message}
							/>

							<InputForm
								label='Assunto:'
								register={form.register}
								name='subject'
								error={form.formState.errors.subject?.message}
							/>
						</div>

						<InputForm
							label='Corpo:'
							register={form.register}
							name='body'
							error={form.formState.errors.body?.message}
						/>

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

export default EmailFormClient;
