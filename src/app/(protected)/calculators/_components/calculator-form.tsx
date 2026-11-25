'use client';

import DialogButton from '@/components/list/dialog-button';
import { CalculatorIcon, CalendarIcon, WashingMachineIcon } from 'lucide-react';
import RuleOfThree from './rule-of-three';
import DoseCalculation from './dose';
import AddDaysToDate from './add-days-to-date';
import DaysBetween from './days-between';

const CalculatorPageForm = () => {
	return (
		<div className='flex flex-col md:flex-row gap-2 flex-wrap'>
			<DialogButton text='Regra de Três Simples' icon={CalculatorIcon} renderForm={() => <RuleOfThree />} />

			<DialogButton text='Dosagem Nora' icon={WashingMachineIcon} renderForm={() => <DoseCalculation />} />

			<DialogButton text='Calcular dias em data' icon={CalendarIcon} renderForm={() => <AddDaysToDate />} />

			<DialogButton text='Calcular dias entre datas' icon={CalendarIcon} renderForm={() => <DaysBetween />} />
		</div>
	);
};

export default CalculatorPageForm;
