import { smoothScrollTo } from "../utils/scroll";
import { fillProjectSkills } from "./ScanSkills";

export async function fillProjectQuestions() {
  async function fillInput(input: HTMLInputElement, value: string) {
    await smoothScrollTo(input);
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  async function fillDefaultQuestions() {
    const defaultInputs = document.querySelectorAll<HTMLInputElement>(
      'input[id^="defaultProjectQuestionsAnswers-question-"]'
    );
    for (const input of defaultInputs) {
      await fillInput(input, "Preenchido automaticamente");
    }
  }

  async function fillCustomQuestions() {
    let customIndex = 0;
    while (true) {
      const customInput = document.getElementById(
        `custom-question-${customIndex}`
      ) as HTMLInputElement | null;
      if (!customInput) {
        break;
      }
      await fillInput(customInput, "Resposta customizada");
      customIndex++;
    }
  }

  async function runFill() {
    await fillDefaultQuestions();
    await fillCustomQuestions();
    fillProjectSkills();
  }

  runFill();
}
