// Arquivo para gerenciar comunicação com a API do GPT para geração de propostas
// baseadas na descrição do projeto

import { DEFAULT_PROMPT_TEMPLATE, apiUrl, loadingMessages, fallbackMessages } from "../utils/template-gpt";

export interface GPTProposalResponse {
  description: string;
  deliveryTime: string;
  suggestedHours: number;
  answersToQuestions: string;
}

export interface GPTRequestOptions {
  description: string;
  hourlyRate?: string;
  maxTokens?: number;
  temperature?: number;
}

function createLoadingIndicator(message: string = loadingMessages.start): HTMLDivElement {
  removeLoadingIndicator();

  const indicator = document.createElement("div");
  indicator.id = "gpt-loading-indicator";
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(to right, #9333ea, #6366f1);
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    font-family: sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    display: flex;
    align-items: center;
    min-width: 250px;
  `;

  const messageElement = document.createElement("span");
  messageElement.textContent = message;

  indicator.appendChild(messageElement);
  document.body.appendChild(indicator);

  return indicator;
}

function updateLoadingIndicator(message: string): void {
  const indicator = document.getElementById("gpt-loading-indicator");
  if (indicator) {
    const messageElement = indicator.querySelector("span");
    if (messageElement) {
      messageElement.textContent = message;
    }
  } else {
    createLoadingIndicator(message);
  }
}

function removeLoadingIndicator(): void {
  const existingIndicator = document.getElementById("gpt-loading-indicator");
  if (existingIndicator) {
    existingIndicator.remove();
  }
}

export async function generateProposal(options: GPTRequestOptions): Promise<GPTProposalResponse> {
  const { description, hourlyRate = '100', maxTokens = 1200, temperature = 0.7 } = options;
  
  createLoadingIndicator();
  
  try {
    updateLoadingIndicator(loadingMessages.analyzing);
    
    const apiKey = "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";
    
    const aboutYou = localStorage.getItem('workana_about_you') || '';
    const marketingMethodology = localStorage.getItem('workana_marketing_methodology') || '';
    
    const prompt = DEFAULT_PROMPT_TEMPLATE
      .replace('{description}', description)
      .replace('{hourlyRate}', hourlyRate)
      .replace('{aboutYou}', aboutYou || 'Informações não fornecidas')
      .replace('{marketingMethodology}', marketingMethodology || 'Metodologia não fornecida');
    
    updateLoadingIndicator(loadingMessages.generating);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
        n: 1
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Erro na API do OpenAI: ${errorData.error?.message || response.statusText}`);
    }

    updateLoadingIndicator(loadingMessages.finalizing);
    const responseData = await response.json();
    const content = responseData.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Resposta vazia da API do OpenAI");
    }

    try {
      const parsedResponse: GPTProposalResponse = JSON.parse(content);
      
      // Forçar sempre 150 horas para o projeto
      parsedResponse.suggestedHours = 150;

      updateLoadingIndicator(loadingMessages.complete);
      setTimeout(() => {
        removeLoadingIndicator();
      }, 1500);

      return parsedResponse;
    } catch (error) {
      throw new Error("Formato inválido na resposta da API");
    }
  } catch (error) {
    updateLoadingIndicator(loadingMessages.error);
    setTimeout(() => {
      removeLoadingIndicator();
    }, 3000);

    return {
      description: fallbackMessages.description,
      deliveryTime: fallbackMessages.deliveryTime,
      suggestedHours: 150, // Valor fixo de 150 horas
      answersToQuestions: fallbackMessages.answersToQuestions,
    };
  }
}
