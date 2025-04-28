import { smoothScrollTo } from '../utils/scroll';
import { fillProposalDetails } from './fillDescription';

export async function fillProjectBudgetHours() {
  const hoursInput = document.getElementById('Hours') as HTMLInputElement | null;

  if (!hoursInput) {
    console.error('Campo de horas não encontrado.');
    return;
  }

  await smoothScrollTo(hoursInput);

  hoursInput.focus();
  hoursInput.value = '20';
  hoursInput.dispatchEvent(new Event('input', { bubbles: true }));
  fillProposalDetails();
}
