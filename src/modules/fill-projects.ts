import { smoothScrollTo } from "../utils/scroll";
import { fillProjectBudgetHours } from "./fill-hours";
import { scanProject } from "./ScanProjects";
import { GPTProposalResponse, generateProposal } from "./gpt-service";
import { domSelectors } from "../utils/template-gpt";

export async function fillProjectPortfolio(gptResponse?: GPTProposalResponse | null) {
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

  async function clickPortfolio(label: HTMLLabelElement) {
    await smoothScrollTo(label);
    label.click();
  }

  async function selectPortfolioProjects(response: GPTProposalResponse) {
    const portfolioButtons = document.querySelectorAll<HTMLLabelElement>(domSelectors.portfolioButtons);
    if (portfolioButtons.length === 0) {
      console.log('Nenhum projeto de portfólio encontrado. Avançando para o próximo passo...');
      const currentUrl = window.location.href;
      if (currentUrl.includes('workana.com/messages/bid/')) {
        fillProjectBudgetHours(response);
      } else {
        console.log('Não está na página de projeto específico, apenas scanProject será executado');
        scanProject();
      }
      return;
    }

    const numberToSelect = Math.min(3, portfolioButtons.length);
    for (let i = 0; i < numberToSelect; i++) {
      const label = portfolioButtons[i];
      await clickPortfolio(label);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const currentUrl = window.location.href;
    if (currentUrl.includes('workana.com/messages/bid/')) {
      fillProjectBudgetHours(response);
    } else {
      console.log('Não está na página de projeto específico, apenas scanProject será executado');
      scanProject();
    }
  }
  
  const response = await getGPTResponse();
  
  if (!response) {
    console.error("Falha ao obter resposta do GPT, não é possível prosseguir.");
    return;
  }
  
  await selectPortfolioProjects(response);
}
