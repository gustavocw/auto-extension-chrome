import { smoothScrollTo } from "../utils/scroll";
import { fillProjectSkills } from "./fill-skills";
import { generateProposal, GPTProposalResponse } from "./gpt-service";
import { domSelectors, fallbackMessages } from "../utils/template-gpt";

interface QuestionData {
  id: string;
  question: string;
  element: HTMLInputElement;
}

async function waitForInput(
  selector: string,
  timeout = 5000
): Promise<boolean> {
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
  let gptResponse: GPTProposalResponse | null = null;
  function extractQuestions(): QuestionData[] {
    const questions: QuestionData[] = [];
    const defaultInputs = document.querySelectorAll<HTMLInputElement>(
      domSelectors.defaultQuestions
    );

    defaultInputs.forEach((input) => {
      const label = input.closest(".form-group")?.querySelector("label");
      if (label && label.textContent) {
        questions.push({
          id: input.id,
          question: label.textContent.trim(),
          element: input,
        });
      }
    });
    const customInputs = document.querySelectorAll<HTMLInputElement>(
      domSelectors.customQuestions
    );
    customInputs.forEach((input) => {
      const label = input.closest(".form-group")?.querySelector("label");
      if (label && label.textContent) {
        questions.push({
          id: input.id,
          question: label.textContent.trim(),
          element: input,
        });
      }
    });

    return questions;
  }

  async function getGPTResponse(
    questions: QuestionData[]
  ): Promise<GPTProposalResponse | null> {
    const projectDescription = localStorage.getItem(
      "workana_project_description"
    );
    if (!projectDescription) {
      console.error("Descrição do projeto não encontrada no localStorage.");
      return null;
    }

    const hourlyRate = localStorage.getItem("workana_hourly_rate") || "50";
    const questionsText = questions.map((q) => `- ${q.question}`).join("\n");
    const enhancedDescription = `${projectDescription}\n\nPERGUNTAS QUE PRECISAM SER RESPONDIDAS:\n${questionsText}`;
    try {
      return await generateProposal({
        description: enhancedDescription,
        hourlyRate: hourlyRate,
      });
    } catch (error) {
      console.error("Erro ao gerar proposta com GPT:", error);
      return null;
    }
  }

  async function fillInput(input: HTMLInputElement, value: string) {
    await smoothScrollTo(input);
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  async function fillQuestions(
    questions: QuestionData[],
    response: GPTProposalResponse
  ) {
    const availabilityQuestion = questions.find(
      (q) =>
        q.question.toLowerCase().includes("disponibilidade") ||
        q.id.includes("availability_to_start")
    );
    const timeNeededQuestion = questions.find(
      (q) =>
        q.question.toLowerCase().includes("tempo") ||
        q.id.includes("delivery_time_needed")
    );
    const experienceQuestion = questions.find(
      (q) =>
        q.question.toLowerCase().includes("experiência") ||
        q.id.includes("experience_on_this_type_of_projects")
    );
    const dataNeededQuestion = questions.find(
      (q) =>
        q.question.toLowerCase().includes("informações") ||
        q.id.includes("data_needed_to_start")
    );
    for (const q of questions) {
      let answer = response.answersToQuestions;

      if (q === availabilityQuestion) {
        answer = fallbackMessages.availabilityAnswer;
      } else if (q === timeNeededQuestion) {
        answer = response.deliveryTime;
      } else if (q === experienceQuestion) {
        answer = response.answersToQuestions;
      } else if (q === dataNeededQuestion) {
        answer = fallbackMessages.dataNeededAnswer;
      }

      await fillInput(q.element, answer);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  async function runFill() {
    const ready = await waitForInput(
      `${domSelectors.defaultQuestions}, ${domSelectors.customQuestions}`
    );
    if (!ready) {
      console.log(
        "Inputs de perguntas não carregaram. Avançando para o próximo passo..."
      );
      await fillProjectSkills(gptResponse);
      return;
    }
    const questions = extractQuestions();
    if (questions.length === 0) {
      console.log(
        "Nenhuma pergunta encontrada. Avançando para o próximo passo..."
      );
      await fillProjectSkills(gptResponse);
      return;
    }
    gptResponse = await getGPTResponse(questions);
    if (!gptResponse) {
      console.error(
        "Falha ao obter resposta do GPT, não é possível prosseguir."
      );
      return;
    }

    localStorage.setItem("workana_gpt_answers", gptResponse.answersToQuestions);
    await fillQuestions(questions, gptResponse);
    await fillProjectSkills(gptResponse);
  }
  runFill();
}
