import { smoothScrollTo } from "../utils/scroll";

export async function fillProposalDetails() {
  const descriptionInput = document.getElementById(
    "BidContent"
  ) as HTMLTextAreaElement | null;
  const deliveryTimeInput = document.getElementById(
    "BidDeliveryTime"
  ) as HTMLInputElement | null;
  const hoursInput = document.getElementById(
    "Hours"
  ) as HTMLInputElement | null;

  if (!descriptionInput || !deliveryTimeInput || !hoursInput) {
    console.error("Algum campo obrigatório não foi encontrado.");
    return;
  }

  await smoothScrollTo(descriptionInput);
  descriptionInput.focus();
  descriptionInput.value =
    "Olá, tenho experiência no desenvolvimento de projetos similares e estou à disposição para realizar este trabalho com qualidade e eficiência.";
  descriptionInput.dispatchEvent(new Event("input", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 500));

  await smoothScrollTo(deliveryTimeInput);
  deliveryTimeInput.focus();
  deliveryTimeInput.value = "5 dias";
  deliveryTimeInput.dispatchEvent(new Event("input", { bubbles: true }));

  await new Promise((resolve) => setTimeout(resolve, 500));

  const submitButton = document.querySelector(
    'input[type="submit"].btn-primary'
  ) as HTMLInputElement | null;

  if (submitButton) {
    await smoothScrollTo(submitButton);

    submitButton.style.transition = "box-shadow 0.5s ease, transform 0.3s ease";
    submitButton.style.boxShadow = "0 0 12px 4px #4CAF50";
    submitButton.style.transform = "scale(1.05)";
    // Futuro: para clicar automaticamente, descomente a linha abaixo
    // submitButton.click();
    console.log("Botão de envio preparado para clique.");
  } else {
    console.error("Botão de envio de orçamento não encontrado.");
  }
}
