import { smoothScrollTo } from "../utils/scroll";
import { fillProjectPortfolio } from "./fill-projects";
import { GPTProposalResponse, generateProposal } from "./gpt-service";
import { domSelectors } from "../utils/template-gpt";

async function waitForSkillsList(timeout = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const interval = 100;
    let elapsed = 0;

    const check = () => {
      const skillsList = document.querySelectorAll<HTMLLIElement>(
        domSelectors.skillsList
      );
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

export async function fillProjectSkills(
  gptResponse?: GPTProposalResponse | null
) {
  async function getGPTResponse(): Promise<GPTProposalResponse | null> {
    if (gptResponse) return gptResponse;

    const projectDescription = localStorage.getItem(
      "workana_project_description"
    );
    if (!projectDescription) {
      console.error("Descrição do projeto não encontrada no localStorage.");
      return null;
    }

    const hourlyRate = localStorage.getItem("workana_hourly_rate") || "50";

    try {
      return await generateProposal({
        description: projectDescription,
        hourlyRate: hourlyRate,
      });
    } catch (error) {
      console.error("Erro ao gerar proposta com GPT:", error);
      return null;
    }
  }

  async function clickSkill(skillElement: HTMLElement) {
    await smoothScrollTo(skillElement);
    skillElement.click();
  }

  async function openSkillsDropdown() {
    const selectors = [
      domSelectors.skillsDropdown,
      ".multi-select-search-field",
      ".multi-select-container input",
      ".multi-select-placeholder",
      ".skills-container .multi-select",
      'input[placeholder*="habilidade"]',
      ".skills-selection-wrapper input",
    ];

    let inputField = null;

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        inputField = element as HTMLElement;
        console.log(`Campo de habilidades encontrado com seletor: ${selector}`);
        break;
      }
    }

    if (!inputField) {
      const skillContainers = document.querySelectorAll(
        'div[class*="skill" i]'
      );
      if (skillContainers.length > 0) {
        console.log("Container de habilidades encontrado por classe parcial");
        for (const container of skillContainers) {
          const input =
            container.querySelector("input") ||
            container.querySelector(".multi-select");
          if (input) {
            inputField = input as HTMLElement;
            break;
          }
        }
      }
    }

    if (!inputField) {
      console.error(
        "Nenhum campo de seleção de habilidades encontrado após múltiplas tentativas."
      );
      return false;
    }

    await smoothScrollTo(inputField);

    try {
      (inputField as HTMLElement).focus();
      await new Promise((resolve) => setTimeout(resolve, 300));

      (inputField as HTMLElement).click();
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (inputField instanceof HTMLInputElement) {
        inputField.value = " ";
        inputField.dispatchEvent(new Event("input", { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 300));

        inputField.value = "";
        inputField.dispatchEvent(new Event("input", { bubbles: true }));
      }

      (inputField as HTMLElement).click();

      const dropdownVisible = await waitForSkillsList(2000);
      if (!dropdownVisible) {
        const parent = inputField.parentElement;
        if (parent) {
          await smoothScrollTo(parent);
          (parent as HTMLElement).click();
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      return true;
    } catch (error) {
      console.error("Erro ao interagir com campo de habilidades:", error);
      return false;
    }
  }

  async function selectSkills(gptResponse: GPTProposalResponse) {
    const skillsList = document.querySelectorAll<HTMLLIElement>(
      domSelectors.skillsList
    );

    if (skillsList.length === 0) {
      console.log(
        "Nenhuma habilidade disponível para seleção. Avançando para o próximo passo..."
      );
      fillProjectPortfolio(gptResponse);
      return;
    }

    const numberToSelect = Math.min(5, skillsList.length);
    for (let i = 0; i < numberToSelect; i++) {
      const skill = skillsList[i];
      await clickSkill(skill);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("Habilidades selecionadas.");
    fillProjectPortfolio(gptResponse);
  }

  async function runFill() {
    const response = await getGPTResponse();

    if (!response) {
      console.error(
        "Falha ao obter resposta do GPT, não é possível prosseguir."
      );
      return;
    }

    const opened = await openSkillsDropdown();
    if (opened) {
      const listAppeared = await waitForSkillsList();
      if (listAppeared) {
        await selectSkills(response);
      } else {
        console.log(
          "Lista de habilidades não apareceu. Avançando para o próximo passo..."
        );
        fillProjectPortfolio(response);
      }
    } else {
      console.log(
        "Não foi possível abrir o dropdown de habilidades. Avançando para o próximo passo..."
      );
      fillProjectPortfolio(response);
    }
  }

  runFill();
}
