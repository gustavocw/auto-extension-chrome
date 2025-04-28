import { smoothScrollTo } from "../utils/scroll";
import { GPTProposalResponse, generateProposal } from "./gpt-service";
import { domSelectors, fallbackMessages } from "../utils/template-gpt";

export async function fillProposalDetails(gptResponse?: GPTProposalResponse | null) {
  const descriptionInput = document.getElementById(
    domSelectors.descriptionInput.replace("#", "")
  ) as HTMLTextAreaElement | null;

  const deliveryTimeInput = document.getElementById(
    domSelectors.deliveryTimeInput.replace("#", "")
  ) as HTMLInputElement | null;

  if (!descriptionInput || !deliveryTimeInput) {
    console.error("Inputs obrigatórios não encontrados.");
    return;
  }

  try {
    let proposal: GPTProposalResponse;

    if (gptResponse) {
      proposal = gptResponse;
    } else {
      const projectDescription = localStorage.getItem("workana_project_description");
      if (!projectDescription) {
        throw new Error("Descrição do projeto não disponível");
      }

      const hourlyRate = localStorage.getItem("workana_hourly_rate") || "50";

      proposal = await generateProposal({
        description: projectDescription,
        hourlyRate: hourlyRate,
      });
    }

    await smoothScrollTo(descriptionInput);
    descriptionInput.focus();
    descriptionInput.value = proposal.description;
    descriptionInput.dispatchEvent(new Event("input", { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 500));

    await smoothScrollTo(deliveryTimeInput);
    deliveryTimeInput.focus();
    deliveryTimeInput.value = proposal.deliveryTime;
    deliveryTimeInput.dispatchEvent(new Event("input", { bubbles: true }));

    localStorage.setItem("workana_gpt_answers", proposal.answersToQuestions);

  } catch (error) {
    console.error("Erro ao gerar proposta GPT. Preenchendo fallback.");

    await smoothScrollTo(descriptionInput);
    descriptionInput.focus();
    descriptionInput.value = fallbackMessages.description;
    descriptionInput.dispatchEvent(new Event("input", { bubbles: true }));
  }

  // Preparar botão de envio, mas sem clicar ainda
  const submitButton = document.querySelector(
    domSelectors.submitButton
  ) as HTMLInputElement | null;

  if (submitButton) {
    await smoothScrollTo(submitButton);
    submitButton.style.transition = "box-shadow 0.5s ease, transform 0.3s ease";
    submitButton.style.boxShadow = "0 0 12px 4px #4CAF50";
    submitButton.style.transform = "scale(1.05)";
    console.log("Botão de envio destacado. Pronto para clique.");
    // submitButton.click(); // Descomente no futuro para clicar automaticamente
  }
}
