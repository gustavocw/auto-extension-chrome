import { smoothScrollTo } from "../utils/scroll";
import { fillProjectBudgetHours } from "./SelectHours";

export async function fillProjectPortfolio() {
  async function clickPortfolio(label: HTMLLabelElement) {
    await smoothScrollTo(label);
    label.click();
  }

  async function selectPortfolioProjects() {
    const portfolioButtons = document.querySelectorAll<HTMLLabelElement>('label#selectPortfolio');

    if (portfolioButtons.length === 0) {
      console.error('Nenhum projeto de portfólio encontrado.');
      return;
    }

    const numberToSelect = Math.min(3, portfolioButtons.length);

    for (let i = 0; i < numberToSelect; i++) {
      const label = portfolioButtons[i];
      await clickPortfolio(label);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    fillProjectBudgetHours();
  }
  
  await selectPortfolioProjects();
}
