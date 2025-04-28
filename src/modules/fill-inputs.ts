import { smoothScrollTo } from "../utils/scroll";
import { fillProjectSkills } from "./ScanSkills";

async function waitForInput(selector: string, timeout = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const interval = 100;
    let elapsed = 0;

    const check = () => {
      const element = document.querySelector(selector);
      if (element) {
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
    const customInputs = document.querySelectorAll<HTMLInputElement>(
      'input[id^="customProjectQuestionsAnswers-question-"]'
    );
    for (const input of customInputs) {
      await fillInput(input, "Resposta customizada");
    }
  }

  async function runFill() {
    const ready = await waitForInput(
      'input[id^="defaultProjectQuestionsAnswers-question-"], input[id^="customProjectQuestionsAnswers-question-"]'
    );

    if (!ready) {
      console.error('Inputs de perguntas não carregaram.');
      return;
    }

    await fillDefaultQuestions();
    await fillCustomQuestions();
    await fillProjectSkills();
  }

  runFill();
}
