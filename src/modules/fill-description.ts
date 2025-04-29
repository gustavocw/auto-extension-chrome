import { smoothScrollTo } from "../utils/scroll";
import { GPTProposalResponse, generateProposal } from "./gpt-service";
import { domSelectors, fallbackMessages } from "../utils/template-gpt";

export async function fillProposalDetails(
  gptResponse?: GPTProposalResponse | null
) {
  const descriptionInput = document.getElementById(
    domSelectors.descriptionInput.replace("#", "")
  ) as HTMLTextAreaElement | null;
  const deliveryTimeInput = document.getElementById(
    domSelectors.deliveryTimeInput.replace("#", "")
  ) as HTMLInputElement | null;
  const hoursInput = document.getElementById(
    domSelectors.hoursInput.replace("#", "")
  ) as HTMLInputElement | null;

  if (!descriptionInput || !deliveryTimeInput || !hoursInput) {
    return;
  }

  try {
    let proposal: GPTProposalResponse;

    if (gptResponse) {
      proposal = gptResponse;
    } else {
      const projectDescription = localStorage.getItem(
        "workana_project_description"
      );
      if (!projectDescription) {
        throw new Error("Descrição do projeto não disponível");
      }

      const hourlyRate = localStorage.getItem("workana_hourly_rate") || "50";

      proposal = await generateProposal({
        description: projectDescription,
        hourlyRate: hourlyRate,
      });
    }

    proposal.suggestedHours = 150;

    await smoothScrollTo(descriptionInput);
    descriptionInput.focus();
    descriptionInput.value = proposal.description;
    descriptionInput.dispatchEvent(new Event("input", { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 500));

    await smoothScrollTo(deliveryTimeInput);
    deliveryTimeInput.focus();
    deliveryTimeInput.value = "A ser definido em reunião";
    deliveryTimeInput.dispatchEvent(new Event("input", { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 500));

    await smoothScrollTo(hoursInput);
    hoursInput.focus();
    hoursInput.value = proposal.suggestedHours.toString();
    hoursInput.dispatchEvent(new Event("input", { bubbles: true }));

    await fillProjectQuestions();

    localStorage.setItem("workana_gpt_answers", proposal.answersToQuestions);
  } catch (error) {
    await smoothScrollTo(descriptionInput);
    descriptionInput.focus();
    descriptionInput.value = fallbackMessages.description;
    descriptionInput.dispatchEvent(new Event("input", { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 500));

    await smoothScrollTo(deliveryTimeInput);
    deliveryTimeInput.focus();
    deliveryTimeInput.value = "A ser definido em reunião";
    deliveryTimeInput.dispatchEvent(new Event("input", { bubbles: true }));

    await new Promise((resolve) => setTimeout(resolve, 500));

    await smoothScrollTo(hoursInput);
    hoursInput.focus();
    hoursInput.value = "150";
    hoursInput.dispatchEvent(new Event("input", { bubbles: true }));

    await fillProjectQuestions();
  }

  const submitButton = document.querySelector(
    domSelectors.submitButton
  ) as HTMLInputElement | null;

  if (submitButton) {
    await smoothScrollTo(submitButton);
    submitButton.style.transition = "box-shadow 0.5s ease, transform 0.3s ease";
    submitButton.style.boxShadow = "0 0 12px 4px #4CAF50";
    submitButton.style.transform = "scale(1.05)";
  }
}

interface ProjectQuestion {
  id: string;
  fieldId: string;
  question: string;
  answer: string;
}

async function fillProjectQuestions() {
  const knownQuestions: Record<string, keyof typeof fallbackMessages> = {
    availability_to_start: "availabilityAnswer",
    data_needed_to_start: "dataNeededAnswer",
    chosen_one_reason: "answersToQuestions",
  };

  const defaultQuestionInputs = document.querySelectorAll<HTMLInputElement>(
    'input[id^="defaultProjectQuestionsAnswers-question-"]'
  );
  const customQuestionInputs = document.querySelectorAll<HTMLInputElement>(
    'input[id^="customProjectQuestionsAnswers-question-"]'
  );

  if (defaultQuestionInputs.length === 0 && customQuestionInputs.length === 0) {
    return;
  }

  const questions: ProjectQuestion[] = [];

  defaultQuestionInputs.forEach((input) => {
    const fieldId = input.id;
    const idMatch = fieldId.match(
      /defaultProjectQuestionsAnswers-question-(.+)/
    );
    if (!idMatch) return;

    const id = idMatch[1];
    const labelElement = document.querySelector(`label[for="${fieldId}"]`);
    const question = labelElement?.textContent?.trim() || "";

    questions.push({ id, fieldId, question, answer: "" });
  });

  customQuestionInputs.forEach((input) => {
    const fieldId = input.id;
    const idMatch = fieldId.match(
      /customProjectQuestionsAnswers-question-(.+)/
    );
    if (!idMatch) return;

    const id = idMatch[1];
    const labelElement = document.querySelector(`label[for="${fieldId}"]`);
    const question = labelElement?.textContent?.trim() || "";

    questions.push({ id, fieldId, question, answer: "" });
  });

  if (questions.length === 0) {
    return;
  }

  for (const question of questions) {
    let answer: any = "";

    if (knownQuestions[question.id]) {
      answer = fallbackMessages[knownQuestions[question.id]];
    } else {
      answer = fallbackMessages.answersToQuestions;
    }

    const inputElement = document.getElementById(
      question.fieldId
    ) as HTMLInputElement | null;
    if (inputElement) {
      await smoothScrollTo(inputElement);
      inputElement.focus();
      inputElement.value = answer;
      inputElement.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
}
