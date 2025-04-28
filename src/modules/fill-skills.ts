import { smoothScrollTo } from "../utils/scroll";
import { fillProjectPortfolio } from "./fill-projects";

async function waitForSkillsList(timeout = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const interval = 100;
    let elapsed = 0;

    const check = () => {
      const skillsList = document.querySelectorAll<HTMLLIElement>('.multi-select-results-item');
      if (skillsList.length > 0) {
        resolve(true);
      } else if (elapsed >= timeout) {
        resolve(false);
      } else {
        elapsed += interval;
        setTimeout(check, interval);
      }
    };

    check();
  });
}

export async function fillProjectSkills() {
  async function clickSkill(skillElement: HTMLElement) {
    await smoothScrollTo(skillElement);
    skillElement.click();
  }

  async function openSkillsDropdown() {
    const inputField = document.querySelector<HTMLInputElement>('input.multi-select-search-field');
    if (inputField) {
      await smoothScrollTo(inputField);
      inputField.focus();
      inputField.click();
      return true;
    } else {
      console.error('Campo de pesquisa de habilidade não encontrado.');
      return false;
    }
  }

  async function selectSkills() {
    const skillsList = document.querySelectorAll<HTMLLIElement>('.multi-select-results-item');

    if (skillsList.length === 0) {
      console.error('Nenhuma habilidade disponível para seleção.');
      return;
    }

    const numberToSelect = Math.min(5, skillsList.length);
    for (let i = 0; i < numberToSelect; i++) {
      const skill = skillsList[i];
      await clickSkill(skill);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('Habilidades selecionadas.');
  }

  async function runFill() {
    const opened = await openSkillsDropdown();
    if (opened) {
      const listAppeared = await waitForSkillsList();
      if (listAppeared) {
        await selectSkills();
        fillProjectPortfolio();
      } else {
      }
    }
  }

  runFill();
}
