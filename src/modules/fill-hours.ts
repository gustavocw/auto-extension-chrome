import { smoothScrollTo } from '../utils/scroll';
import { fillProposalDetails } from './fill-description';
import { GPTProposalResponse, generateProposal } from "./gpt-service";

export async function fillProjectBudgetHours(gptResponse?: GPTProposalResponse | null) {
  async function getGPTResponse(): Promise<GPTProposalResponse | null> {
    if (gptResponse) return gptResponse;
    const projectDescription = localStorage.getItem("workana_project_description");
    if (!projectDescription) {
      console.error("Descrição do projeto não encontrada no localStorage.");
      return null;
    }
    const hourlyRate = localStorage.getItem("workana_hourly_rate") || "50";
    
    try {
      return await generateProposal({
        description: projectDescription,
        hourlyRate: hourlyRate
      });
    } catch (error) {
      console.error("Erro ao gerar proposta com GPT:", error);
      return null;
    }
  }

  const hoursInput = document.getElementById('Hours') as HTMLInputElement | null;
  if (!hoursInput) {
    console.error('Campo de horas não encontrado.');
    return;
  }
  
  const response = await getGPTResponse();
  if (!response) {
    console.error("Falha ao obter resposta do GPT, não é possível prosseguir.");
    return;
  }

  await smoothScrollTo(hoursInput);

  hoursInput.focus();
  hoursInput.value = response.suggestedHours.toString();
  hoursInput.dispatchEvent(new Event('input', { bubbles: true }));
  
  fillProposalDetails(response);
}
