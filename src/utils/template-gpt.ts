export const DEFAULT_PROMPT_TEMPLATE = `
Você é um assistente especializado em criar propostas para freelancers no Workana.
Analise a descrição do projeto abaixo e crie uma proposta profissional.

DESCRIÇÃO DO PROJETO:
###
{description}
###

INFORMAÇÕES SOBRE O FREELANCER:
###
{aboutYou}
###

METODOLOGIA DE MARKETING PREFERIDA:
###
{marketingMethodology}
###

O freelancer cobra R$ {hourlyRate} por hora.

PERGUNTAS ESPECÍFICAS DO PROJETO:
1. Informe sua disponibilidade para começar
2. Defina de quais informações você precisa para começar
3. Explique porque você é o candidato ideal

ATENÇÃO: REGRAS IMPORTANTES QUE VOCÊ DEVE SEGUIR:
1. NUNCA mencione valores monetários, preços, taxas ou comissões na descrição ou respostas.
2. NUNCA inclua seu contato pessoal como e-mail, telefone, WhatsApp ou links para redes sociais.
3. NUNCA mencione plataformas externas que possam ser usadas para comunicação fora do Workana.
4. Mantenha a proposta profissional, clara e objetiva.
5. Use primeira pessoa do singular (eu).
6. Incorpore naturalmente as informações sobre o freelancer e sua metodologia de marketing na proposta.
7. Adapte a proposta de acordo com o tipo de projeto, demonstrando compreensão das necessidades do cliente.
8. Responda especificamente à pergunta "Explique porque você é o candidato ideal" com detalhes convincentes.
9. Em ser o candidato ideal pode dizer sobre o projeto Credliber, app de venda de FGTS com mais de 20k de downloads e mis de 15 milhões de reais movimentdos.

Se houver perguntas específicas na descrição do projeto após a seção "PERGUNTAS QUE PRECISAM SER RESPONDIDAS:", 
forneça respostas detalhadas e personalizadas para cada uma delas, baseando-se no contexto do projeto.

Sua resposta deve seguir estritamente este formato JSON:
{
  "description": "Uma proposta profissional e personalizada baseada na descrição do projeto. Deve ser detalhada, demonstrar compreensão do projeto e destacar as habilidades relevantes. Entre 150-300 palavras. NUNCA mencione valores monetários ou formas de contato externas.",
  "deliveryTime": "Prazo de entrega sugerido (ex: '7 dias', '2 semanas', etc.)",
  "suggestedHours": número inteiro representando quantas horas você estima para concluir este projeto,
  "answersToQuestions": "Uma resposta convincente específica para a pergunta 'Explique porque você é o candidato ideal', destacando experiência, habilidades relevantes para este projeto e diferenciais competitivos."
}
`;

export const apiUrl = "https://api.openai.com/v1/chat/completions";

export const loadingMessages = {
  start: "Estou analisando o projeto e gerando sua proposta...",
  analyzing: "Analisando descrição do projeto...",
  generating: "Gerando proposta personalizada...",
  finalizing: "Finalizando sua proposta...",
  error: "Erro ao gerar proposta. Tentando novamente...",
  complete: "Proposta gerada com sucesso!",
};

export const fallbackMessages = {
  description: "Olá, analisei seu projeto e tenho interesse em colaborar. Tenho experiência com projetos similares e posso entregar resultados de qualidade dentro do prazo estipulado.",
  deliveryTime: "7 dias",
  suggestedHours: 150,
  answersToQuestions: "Sou o candidato ideal para este projeto porque possuo extensa experiência com projetos similares, domino as tecnologias necessárias e tenho um histórico comprovado de entregas pontuais e de alta qualidade. Meu diferencial é combinar habilidades técnicas com uma visão estratégica, sempre focado em entregar resultados que superem as expectativas do cliente.",
  availabilityAnswer: "Posso começar imediatamente após a aprovação da proposta.",
  dataNeededAnswer: "Precisarei de acesso aos requisitos detalhados do projeto, exemplos ou referências, e um contato para esclarecimento de dúvidas durante o desenvolvimento.",
};

export const domSelectors = {
  descriptionInput: "#BidContent",
  deliveryTimeInput: "#BidDeliveryTime",
  hoursInput: "#Hours",
  submitButton: 'input[type="submit"].btn-primary',
  defaultQuestions: 'input[id^="defaultProjectQuestionsAnswers-question-"]',
  customQuestions: 'input[id^="customProjectQuestionsAnswers-question-"]',
  skillsList: '.multi-select-results-item',
  skillsDropdown: 'input.multi-select-search-field',
  portfolioButtons: 'label#selectPortfolio',
};
