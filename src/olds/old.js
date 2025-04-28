(() => {
    console.log("Content script iniciado - verificando página atual...");
  
    // Variável global para armazenar o resultado da análise do GPT
    let gptAnalysisResult = null;
  
    // Função para rolar suavemente até um elemento
    const smoothScrollTo = (element, options = {}) => {
      if (!element) return false;
  
      const defaultOptions = {
        behavior: "smooth",
        block: "center",
        delay: 800, // Tempo de espera após a rolagem em ms
      };
  
      const mergedOptions = { ...defaultOptions, ...options };
  
      // Adicionar destaque visual temporário
      const originalBackground = element.style.backgroundColor;
      const originalTransition = element.style.transition;
  
      element.style.transition = "background-color 0.5s ease";
      element.style.backgroundColor = "rgba(255, 243, 224, 0.8)";
  
      // Rolar até o elemento
      element.scrollIntoView({
        behavior: mergedOptions.behavior,
        block: mergedOptions.block,
      });
  
      // Retornar promessa que resolve após o delay
      return new Promise((resolve) => {
        setTimeout(() => {
          // Restaurar estilos originais
          setTimeout(() => {
            element.style.backgroundColor = originalBackground;
            element.style.transition = originalTransition;
          }, 500);
  
          resolve(true);
        }, mergedOptions.delay);
      });
    };
  
    // Função para expandir detalhes do projeto se estiverem colapsados
    const expandProjectDetails = async () => {
      const expandButton = document.querySelector(
        ".project-status .expand-details"
      );
      const projectDetailSection = document.querySelector("#project-detail");
  
      if (
        expandButton &&
        projectDetailSection &&
        projectDetailSection.classList.contains("collapse")
      ) {
        await smoothScrollTo(expandButton);
        expandButton.click();
        // Aguarda a animação de expansão
        return new Promise((resolve) => setTimeout(resolve, 1000));
      }
      return Promise.resolve();
    };
  
    // Função para procurar e interagir com o seletor de habilidades no formulário de proposta
    const handleSkillsSelection = async (projectDetails) => {
      console.log("Procurando componente de seleção de habilidades...");
  
      const skillsSection = document.querySelector(".project-bid-skills");
      if (!skillsSection) {
        console.warn("Componente de habilidades não encontrado no formulário");
        return false;
      }
  
      await smoothScrollTo(skillsSection);
  
      const displaySelector = skillsSection.querySelector(".display-selector");
      const preSelectedSkills = displaySelector ? 
        Array.from(displaySelector.querySelectorAll("label.skill")).map(skill => 
          skill.querySelector("span").textContent.trim()
        ) : [];
  
      console.log("Habilidades pré-selecionadas:", preSelectedSkills);
  
      if (preSelectedSkills.length >= 5) {
        console.log("Já existem 5 habilidades selecionadas. Não é necessário selecionar mais.");
        return true;
      }
  
      const maxSkills = 5;
      const remainingSlots = maxSkills - preSelectedSkills.length;
  
      const searchInput = skillsSection.querySelector(".multi-select-search-field");
      if (!searchInput) {
        console.warn("Campo de pesquisa de habilidades não encontrado");
        return false;
      }
  
      console.log("Abrindo o seletor de habilidades para obter opções disponíveis...");
  
      await smoothScrollTo(searchInput, { delay: 300 });
      searchInput.click();
      searchInput.focus();
  
      await new Promise(resolve => setTimeout(resolve, 800));
  
      const resultsContainer = document.querySelector(".multi-select-results");
      if (!resultsContainer) {
        console.warn("Lista de habilidades não encontrada após clicar no campo de pesquisa");
        return false;
      }
  
      const skillItems = resultsContainer.querySelectorAll(".multi-select-results-item");
      if (!skillItems.length) {
        console.warn("Nenhuma habilidade encontrada na lista");
        return false;
      }
  
      const availableSkills = Array.from(skillItems).map(item => item.textContent.trim());
      console.log(`Encontradas ${availableSkills.length} habilidades disponíveis:`, availableSkills);
  
      const recommendedSkills = await getGptSkillRecommendations(projectDetails, availableSkills, preSelectedSkills, remainingSlots);
  
      if (!recommendedSkills || recommendedSkills.length === 0) {
        console.warn("GPT não retornou recomendações. Selecionando as primeiras habilidades disponíveis.");
        return selectFirstNSkills(skillItems, preSelectedSkills, remainingSlots);
      }
  
      let selectedCount = 0;
  
      console.log("Selecionando habilidades recomendadas pelo GPT:", recommendedSkills);
  
      for (const recommendedSkill of recommendedSkills) {
        if (selectedCount >= remainingSlots) break;
  
        for (const item of skillItems) {
          const skillName = item.textContent.trim();
  
          if (skillName.toLowerCase() === recommendedSkill.toLowerCase() ||
              skillName.toLowerCase().includes(recommendedSkill.toLowerCase()) ||
              recommendedSkill.toLowerCase().includes(skillName.toLowerCase())) {
  
            console.log(`Selecionando habilidade recomendada: ${skillName}`);
            await smoothScrollTo(item, { delay: 300 });
            item.click();
            selectedCount++;
  
            await new Promise(resolve => setTimeout(resolve, 300));
            break;
          }
        }
      }
  
      console.log(`Selecionadas ${selectedCount} habilidades para o projeto`);
      return selectedCount > 0 || preSelectedSkills.length > 0;
    };
  
    const getGptSkillRecommendations = async (projectDetails, availableSkills, preSelectedSkills, maxToSelect) => {
      try {
        console.log("Solicitando recomendações de habilidades ao GPT...");
  
        const prompt = `
          Projeto: "${projectDetails.title}"
  
          Descrição: "${projectDetails.description.substring(0, 300)}..."
  
          ${preSelectedSkills.length > 0 ? 'Habilidades já selecionadas: ' + preSelectedSkills.join(', ') : ''}
  
          Com base na descrição deste projeto, selecione no máximo ${maxToSelect} habilidades da lista abaixo que melhor se adequam:
          ${availableSkills.join(', ')}
  
          IMPORTANTE: Responda APENAS com os nomes das habilidades separados por vírgula, sem explicações adicionais.`;
  
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer YOUR_API_KEY_HERE`
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: "Você é um especialista em recomendar habilidades técnicas para projetos." },
              { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 150
          })
        });
  
        const data = await response.json();
        console.log("Resposta do GPT para recomendações de habilidades:", data);
  
        if (data.choices && data.choices[0] && data.choices[0].message) {
          const recommendations = data.choices[0].message.content.trim();
          return recommendations.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
        }
  
        return [];
      } catch (error) {
        console.error("Erro ao obter recomendações de habilidades do GPT:", error);
        return [];
      }
    };
  
    let skillsAdded = false;
  
    // Função auxiliar para selecionar as primeiras N habilidades disponíveis (fallback)
    const selectFirstNSkills = async (skillItems, preSelectedSkills, maxToSelect) => {
      let selectedCount = 0;
      
      for (let i = 0; i < skillItems.length && selectedCount < maxToSelect; i++) {
        const item = skillItems[i];
        const skillName = item.textContent.trim();
        
        if (!preSelectedSkills.some(selected => selected.toLowerCase() === skillName.toLowerCase())) {
          console.log(`Selecionando habilidade #${selectedCount + 1}: ${skillName}`);
          await smoothScrollTo(item, { delay: 300 });
          item.click();
          selectedCount++;
          
          // Pequena pausa entre seleções
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      skillsAdded = true
      return selectedCount > 0;
    };
  
    const selectPortfolioProjects = async () => {
      console.log("Procurando projetos de portfólio para selecionar...");
  
      // Selecionar o container dos cartões de portfólio
      const portfolioContainer = document.querySelector("#portfolioCardsContainer");
      if (!portfolioContainer) {
        console.warn("Container de portfólio não encontrado");
        return false;
      }
  
      // Selecionar os primeiros 3 projetos
      const portfolioCards = portfolioContainer.querySelectorAll(".wk-portfolio-card");
      if (portfolioCards.length === 0) {
        console.warn("Nenhum projeto de portfólio encontrado");
        return false;
      }
  
      const maxProjectsToSelect = 3;
      let selectedCount = 0;
  
      for (let i = 0; i < portfolioCards.length && selectedCount < maxProjectsToSelect; i++) {
        const card = portfolioCards[i];
        const selectButton = card.querySelector("label#selectPortfolio");
  
        if (selectButton) {
          console.log(`Selecionando projeto de portfólio #${i + 1}`);
          await smoothScrollTo(selectButton, { delay: 300 });
          selectButton.click();
          selectedCount++;
  
          // Pausa entre seleções para simular comportamento humano
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          console.warn(`Botão de seleção não encontrado para o projeto #${i + 1}`);
        }
      }
  
      console.log(`Selecionados ${selectedCount} projetos de portfólio`);
      return selectedCount > 0;
    };
  
    // Chamar a função para selecionar os projetos de portfólio
    if (document.querySelector("#portfolioCardsContainer") && skillsAdded) {
      selectPortfolioProjects();
    }
  
  
    // Função para extrair detalhes do projeto a partir do componente HTML específico
    const extractProjectFromDetailBox = async () => {
      // Primeiro, expandimos os detalhes do projeto se estiverem colapsados
      await expandProjectDetails();
  
      // Busca o componente específico com as informações do projeto
      const projectDetailBox = document.querySelector(
        ".box-common.project-detail-new"
      );
  
      if (!projectDetailBox) {
        console.warn(
          "Componente de detalhes do projeto não encontrado na página."
        );
        return null;
      }
  
      try {
        // Extrair título do projeto
        const title =
          document.querySelector("h1")?.textContent.trim() ||
          document.querySelector(".project-title")?.textContent.trim() ||
          document.title;
  
        // Extrair informações do cliente
        const clientInfo = {
          name:
            projectDetailBox.querySelector(".user-info h4")?.textContent.trim() ||
            "Nome não disponível",
          country:
            projectDetailBox.querySelector(".country-name")?.textContent.trim() ||
            "País não disponível",
          rating:
            projectDetailBox.querySelector(".profile-stars")?.title ||
            "Sem avaliação",
          projectsPublished:
            projectDetailBox
              .querySelector(".profile-info p:first-child span:nth-child(1)")
              ?.textContent.trim() || "0",
          projectsPaid:
            projectDetailBox
              .querySelector(".profile-info p:first-child span:nth-child(2)")
              ?.textContent.trim() || "0",
          lastAccess:
            projectDetailBox
              .querySelector(".profile-info .date:nth-child(1)")
              ?.textContent.trim() || "Não informado",
          registerDate:
            projectDetailBox
              .querySelector(".profile-info .date:nth-child(2)")
              ?.textContent.trim() || "Não informado",
        };
  
        // Extrair status do projeto
        const projectStatus =
          projectDetailBox
            .querySelector(".project-status .status-label")
            ?.textContent.trim() || "Status não disponível";
  
        // Extrair detalhes da descrição
        const descriptionElement = projectDetailBox.querySelector(
          "#project-detail .specification"
        );
  
        // Rolar até o elemento de descrição para garantir que está no campo de visão
        if (descriptionElement) {
          await smoothScrollTo(descriptionElement);
        }
  
        const description =
          descriptionElement?.innerHTML || "Descrição não disponível";
        const plainDescription = description
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/?[^>]+(>|$)/g, "")
          .replace(/&nbsp;/g, " ")
          .trim();
  
        // Extrair as habilidades/skills
        const skillsElement = projectDetailBox.querySelector(".skills");
        if (skillsElement) {
          await smoothScrollTo(skillsElement);
        }
  
        const skills = Array.from(
          projectDetailBox.querySelectorAll(".skills .skill")
        ).map((skill) => skill.textContent.trim());
  
        // Extrair orçamento
        const budgetElement = projectDetailBox.querySelector(".budget");
        if (budgetElement) {
          await smoothScrollTo(budgetElement);
        }
  
        const budget =
          budgetElement?.textContent.trim() || "Orçamento não especificado";
  
        // Extrair prazo
        const deadlineElement = projectDetailBox.querySelector(".deadline");
        if (deadlineElement) {
          await smoothScrollTo(deadlineElement);
        }
  
        const deadline =
          deadlineElement?.textContent
            .trim()
            .replace(/Prazo de Entrega:\s+/i, "") || "Prazo não especificado";
  
        // Extrair contagem de propostas
        const proposalCount =
          projectDetailBox
            .querySelector(".bids")
            ?.textContent.trim()
            .replace(/\D/g, "") || "0";
  
        // Extrair data de publicação
        const publishedDate =
          projectDetailBox
            .querySelector(".date:not(.deadline)")
            ?.textContent.trim() || "Data não disponível";
  
        // Coletar detalhes adicionais (categoria, subcategoria, etc.)
        const additionalDetails = {};
        const strongElements = projectDetailBox.querySelectorAll(
          ".specification strong"
        );
        Array.from(strongElements).forEach((el) => {
          const key = el.textContent.trim().replace(":", "");
          const value = el.nextSibling?.textContent.trim() || "";
          additionalDetails[key] = value;
        });
  
        // Analisar tipo de projeto com base nas skills
        const isWebDevelopment = skills.some((skill) =>
          [
            "JavaScript",
            "HTML",
            "CSS",
            "React",
            "Vue",
            "Angular",
            "Responsive",
          ].some((kw) => skill.toLowerCase().includes(kw.toLowerCase()))
        );
  
        const isAppDevelopment = skills.some((skill) =>
          ["Android", "iOS", "iPhone", "Mobile"].some((kw) =>
            skill.toLowerCase().includes(kw.toLowerCase())
          )
        );
  
        const isBackendDevelopment = skills.some((skill) =>
          ["Python", "Node.js", "PHP", "Java", "API", "MySQL", "PostgreSQL"].some(
            (kw) => skill.toLowerCase().includes(kw.toLowerCase())
          )
        );
  
        // Construir objeto com os detalhes completos
        const projectDetails = {
          title,
          clientInfo,
          projectStatus,
          description: plainDescription,
          rawHtmlDescription: description,
          skills,
          budget,
          deadline,
          proposalCount,
          publishedDate,
          additionalDetails,
          projectType: {
            isWebDevelopment,
            isAppDevelopment,
            isBackendDevelopment,
          },
          extractedDate: new Date().toLocaleString(),
        };
  
        console.log("🔍 Detalhes do projeto extraídos com sucesso");
  
        return projectDetails;
      } catch (error) {
        console.error(
          "Erro ao extrair detalhes do componente do projeto:",
          error
        );
        return null;
      }
    };
  
    // Função para coletar todos os campos de formulário de proposta, incluindo os customizados
    const collectFormFields = async () => {
      // Encontrar campos padrão - agora com uma busca mais abrangente
      const defaultFields = [];
  
      // Busca direta por ID
      const knownFieldIds = [
        "defaultProjectQuestionsAnswers-question-delivery_time_needed",
        "defaultProjectQuestionsAnswers-question-experience_on_this_type_of_projects",
        "defaultProjectQuestionsAnswers-question-data_needed_to_start",
        "defaultProjectQuestionsAnswers-question-chosen_one_reason",
        "defaultProjectQuestionsAnswers-question-availability_to_start",
      ];
  
      // Verificar cada ID conhecido diretamente
      knownFieldIds.forEach((fieldId) => {
        const element = document.getElementById(fieldId);
        if (element) {
          defaultFields.push({
            id: fieldId,
            name: fieldId.replace("defaultProjectQuestionsAnswers-question-", ""),
            element: element,
            isCustom: false,
            label:
              document
                .querySelector(`label[for="${fieldId}"]`)
                ?.textContent.trim() || fieldId,
          });
        }
      });
  
      // Busca mais genérica para outros campos padrão que podem não estar na lista acima
      document
        .querySelectorAll(
          'input[id^="defaultProjectQuestionsAnswers-question-"], textarea[id^="defaultProjectQuestionsAnswers-question-"]'
        )
        .forEach((field) => {
          // Verificar se já incluímos este campo
          if (!defaultFields.some((f) => f.id === field.id)) {
            defaultFields.push({
              id: field.id,
              name: field.id.replace(
                "defaultProjectQuestionsAnswers-question-",
                ""
              ),
              element: field,
              isCustom: false,
              label:
                document
                  .querySelector(`label[for="${field.id}"]`)
                  ?.textContent.trim() || field.id,
            });
          }
        });
  
      // Encontrar campos customizados
      const customFields = [];
      let customIndex = 0;
      let customField;
  
      do {
        customField = document.querySelector(
          `[id="customProjectQuestionsAnswers-question-${customIndex}"]`
        );
        if (customField) {
          customFields.push({
            id: customField.id,
            name: `custom-question-${customIndex}`,
            element: customField,
            isCustom: true,
            label:
              document
                .querySelector(`label[for="${customField.id}"]`)
                ?.textContent.trim() ||
              `Pergunta personalizada ${customIndex + 1}`,
          });
        }
        customIndex++;
      } while (customField && customIndex < 100); // Limitando a 100 campos para evitar loops infinitos
  
      // Campo de descrição principal
      const mainField = document.querySelector('textarea[name="bid[message]"]');
      if (mainField) {
        defaultFields.push({
          id: "main-message",
          name: "main-message",
          element: mainField,
          isCustom: false,
          label: "Mensagem principal da proposta",
        });
      }
  
      // Campo de orçamento
      const budgetField = document.querySelector(
        'input[name="bid[budget]"], input[name="bid[bid_budget]"]'
      );
      if (budgetField) {
        defaultFields.push({
          id: "budget",
          name: "budget",
          element: budgetField,
          isCustom: false,
          label: "Valor da proposta",
        });
      }
  
      // Log de todos os campos encontrados para depuração
      console.log(
        "Campos do formulário encontrados:",
        [...defaultFields, ...customFields].map((f) => f.id)
      );
  
      return [...defaultFields, ...customFields];
    };
  
    // Função para obter análise completa do projeto pelo GPT
    const getProjectAnalysisFromGPT = async (projectDetails) => {
      console.log("Enviando detalhes do projeto para análise com GPT...");
  
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: "analyze_with_gpt",
            projectDetails: {
              title: projectDetails.title,
              description: projectDetails.description,
              skills: projectDetails.skills || [],
              budget: projectDetails.budget,
              deadline: projectDetails.deadline,
              clientInfo: projectDetails.clientInfo,
              additionalDetails: projectDetails.additionalDetails,
            },
          },
          (response) => {
            console.log("Análise do GPT recebida:", response);
            // Armazena o resultado da análise globalmente para uso posterior
            gptAnalysisResult = response;
            resolve(response);
          }
        );
      });
    };
  
    // Função para selecionar habilidades recomendadas pelo GPT
    const selectSkillsBasedOnGptAnalysis = async (projectDetails) => {
      console.log("Buscando habilidades para selecionar...");
      
      const result = await handleSkillsSelection(projectDetails);
      
      if (!result) {
        console.warn("Falha ao selecionar habilidades. Tentando método alternativo...");
        
        // Método alternativo: enviar mensagem para o script skills-selector.js
        chrome.runtime.sendMessage({
          action: "select_skills",
          skills: [],
          projectContext: {
            title: projectDetails.title,
            description: projectDetails.description,
            skills: projectDetails.skills || [],
          },
        });
      }
  
      // Aguarda um momento para a seleção de habilidades ser concluída
      return new Promise((resolve) => setTimeout(() => resolve(true), 2000));
    };
  
    // Função para obter respostas do GPT para os campos do formulário
    const getAIResponses = async (projectDetails, formFields) => {
      // Se já temos a análise do GPT, usar diretamente
      if (gptAnalysisResult && gptAnalysisResult.questionAnswers) {
        console.log("Usando respostas já geradas pelo GPT");
  
        const formattedResponses = {};
  
        // Mapeia as respostas do GPT para os campos do formulário
        formFields.forEach((field) => {
          const matchingAnswer = gptAnalysisResult.questionAnswers.find(
            (qa) => qa.question.toLowerCase() === field.label.toLowerCase()
          );
  
          if (matchingAnswer) {
            formattedResponses[field.id] = matchingAnswer.answer;
          } else {
            // Respostas padrão para campos que não têm correspondência
            if (field.name === "availability_to_start") {
              formattedResponses[field.id] =
                "Posso começar imediatamente. Tenho disponibilidade integral para dedicar a este projeto e priorizar suas necessidades.";
            } else if (field.name === "experience_on_this_type_of_projects") {
              const relevantTechs = projectDetails.skills.slice(0, 3).join(", ");
              formattedResponses[
                field.id
              ] = `Tenho ampla experiência em projetos similares, incluindo aplicações que utilizam ${relevantTechs}. Já desenvolvi soluções completas com requisitos técnicos semelhantes aos que você descreveu.`;
            } else if (field.name === "data_needed_to_start") {
              formattedResponses[
                field.id
              ] = `Para iniciar precisarei dos detalhes técnicos específicos, documentação existente, acesso aos repositórios de código e requisitos detalhados do sistema. Também seria útil definir o fluxo de trabalho e expectativas de comunicação.`;
            } else if (field.name === "chosen_one_reason") {
              const relevantTechs = projectDetails.skills.slice(0, 3).join(", ");
              formattedResponses[
                field.id
              ] = `Sou o profissional ideal para este projeto porque tenho conhecimento técnico profundo em ${relevantTechs} e vasta experiência em projetos similares. Entendo as complexidades envolvidas e posso entregar uma solução de alta qualidade dentro do prazo acordado.`;
            } else if (field.name === "delivery_time_needed") {
              // Adicionar estimativa de tempo com base na complexidade do projeto
              const complexity = getProjectComplexity(projectDetails);
              if (complexity === "high") {
                formattedResponses[field.id] =
                  "14 dias úteis, distribuídos em etapas de desenvolvimento, testes e ajustes finais.";
              } else if (complexity === "medium") {
                formattedResponses[field.id] =
                  "7 a 10 dias úteis, incluindo análise, desenvolvimento e testes.";
              } else {
                formattedResponses[field.id] =
                  "5 dias úteis, com possibilidade de entrega parcial em 3 dias.";
              }
            } else if (field.name === "budget") {
              // Extrai valor numérico do orçamento do projeto para propor valor competitivo
              const budgetValue = projectDetails.budget.match(/\d[\d,.]+/);
              const proposedValue = budgetValue
                ? parseInt(budgetValue[0].replace(/[,.]/g, "")) * 0.8
                : 1500;
              formattedResponses[field.id] = Math.round(proposedValue).toString();
            } else if (field.name === "main-message") {
              // Usa a proposta detalhada do GPT ou uma mensagem padrão
              formattedResponses[field.id] =
                gptAnalysisResult.proposal ||
                `Olá! 
  
  Analisei com cuidado a descrição do seu projeto e posso ajudá-lo a alcançar os resultados desejados com eficiência e qualidade.
  
  Sou especialista em desenvolvimento de soluções com ampla experiência na área solicitada. Já trabalhei em diversos projetos semelhantes e tenho todos os conhecimentos técnicos necessários para executar este trabalho com excelência.
  
  Minha abordagem se baseia em:
  - Comunicação clara e constante
  - Entregas dentro do prazo
  - Qualidade e atenção aos detalhes
  - Disponibilidade para ajustes e melhorias
  
  Ficarei feliz em discutir mais detalhes sobre como posso contribuir especificamente para o seu projeto. Podemos começar imediatamente após sua aprovação.
  
  Aguardo seu contato!
  Atenciosamente,`;
            } else if (field.isCustom) {
              formattedResponses[field.id] =
                "Tenho ampla experiência e todas as habilidades necessárias para atender esta necessidade específica do projeto.";
            }
          }
        });
  
        return {
          success: true,
          responses: formattedResponses,
        };
      }
  
      // Se não temos a análise, usar o método anterior
      console.log(
        "Análise do GPT não disponível, obtendo respostas para os campos..."
      );
  
      // Preparar dados para enviar ao background script
      const formQuestions = formFields.map((field) => ({
        questionText: field.label,
        fieldId: field.id,
        isCustom: field.isCustom,
      }));
  
      // Enviar mensagem para o background script analisar via serviço de AI
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(
          {
            action: "analyze_questions",
            questions: formQuestions,
            projectContext: {
              title: projectDetails.title,
              description: projectDetails.description,
              skills: projectDetails.skills,
              budget: projectDetails.budget,
              deadline: projectDetails.deadline,
              clientInfo: projectDetails.clientInfo,
            },
          },
          (response) => {
            // Transforma as respostas recebidas em um formato adequado
            const formattedResponses = {};
  
            if (response && response.questionAnswers) {
              response.questionAnswers.forEach((item) => {
                // Encontrar o campo correspondente a esta pergunta
                const matchingField = formFields.find(
                  (field) => field.label === item.question
                );
                if (matchingField) {
                  formattedResponses[matchingField.id] = item.answer;
                }
              });
            }
  
            // Para campos que não receberam resposta da IA, usar respostas padrão
            formFields.forEach((field) => {
              if (!formattedResponses[field.id]) {
                if (field.name === "availability_to_start") {
                  formattedResponses[field.id] =
                    "Posso começar imediatamente. Tenho disponibilidade integral para dedicar a este projeto e priorizar suas necessidades.";
                } else if (field.name === "experience_on_this_type_of_projects") {
                  const relevantTechs = projectDetails.skills
                    .slice(0, 3)
                    .join(", ");
                  formattedResponses[
                    field.id
                  ] = `Tenho ampla experiência em projetos similares, incluindo aplicações que utilizam ${relevantTechs}. Já desenvolvi soluções completas com requisitos técnicos semelhantes aos que você descreveu.`;
                } else if (field.name === "data_needed_to_start") {
                  formattedResponses[
                    field.id
                  ] = `Para iniciar precisarei dos detalhes técnicos específicos, documentação existente, acesso aos repositórios de código e requisitos detalhados do sistema. Também seria útil definir o fluxo de trabalho e expectativas de comunicação.`;
                } else if (field.name === "chosen_one_reason") {
                  const relevantTechs = projectDetails.skills
                    .slice(0, 3)
                    .join(", ");
                  formattedResponses[
                    field.id
                  ] = `Sou o profissional ideal para este projeto porque tenho conhecimento técnico profundo em ${relevantTechs} e vasta experiência em projetos similares. Entendo as complexidades envolvidas e posso entregar uma solução de alta qualidade dentro do prazo acordado.`;
                } else if (field.name === "delivery_time_needed") {
                  // Adicionar estimativa de tempo com base na complexidade do projeto
                  const complexity = getProjectComplexity(projectDetails);
                  if (complexity === "high") {
                    formattedResponses[field.id] =
                      "14 dias úteis, distribuídos em etapas de desenvolvimento, testes e ajustes finais.";
                  } else if (complexity === "medium") {
                    formattedResponses[field.id] =
                      "7 a 10 dias úteis, incluindo análise, desenvolvimento e testes.";
                  } else {
                    formattedResponses[field.id] =
                      "5 dias úteis, com possibilidade de entrega parcial em 3 dias.";
                  }
                } else if (field.name === "budget") {
                  // Extrai valor numérico do orçamento do projeto para propor valor competitivo
                  const budgetValue = projectDetails.budget.match(/\d[\d,.]+/);
                  const proposedValue = budgetValue
                    ? parseInt(budgetValue[0].replace(/[,.]/g, "")) * 0.8
                    : 1500;
                  formattedResponses[field.id] =
                    Math.round(proposedValue).toString();
                } else if (field.name === "main-message") {
                  formattedResponses[field.id] = `Olá! 
  
  Analisei com cuidado a descrição do seu projeto e posso ajudá-lo a alcançar os resultados desejados com eficiência e qualidade.
  
  Sou especialista em desenvolvimento de soluções com ampla experiência na área solicitada. Já trabalhei em diversos projetos semelhantes e tenho todos os conhecimentos técnicos necessários para executar este trabalho com excelência.
  
  Minha abordagem se baseia em:
  - Comunicação clara e constante
  - Entregas dentro do prazo
  - Qualidade e atenção aos detalhes
  - Disponibilidade para ajustes e melhorias
  
  Ficarei feliz em discutir mais detalhes sobre como posso contribuir especificamente para o seu projeto. Podemos começar imediatamente após sua aprovação.
  
  Aguardo seu contato!
  Atenciosamente,`;
                } else if (field.isCustom) {
                  formattedResponses[field.id] =
                    "Tenho ampla experiência e todas as habilidades necessárias para atender esta necessidade específica do projeto.";
                }
              }
            });
  
            resolve({
              success: true,
              responses: formattedResponses,
            });
          }
        );
      });
    };
  
    // Função para estimar complexidade do projeto
    const getProjectComplexity = (projectDetails) => {
      const description = projectDetails.description.toLowerCase();
      const wordCount = description.split(/\s+/).length;
  
      // Palavras-chave que indicam complexidade
      const complexityKeywords = [
        "complexo",
        "complexa",
        "avançado",
        "avançada",
        "integração",
        "sistema",
        "grande",
        "enterprise",
        "escalável",
        "banco de dados",
        "api",
        "apis",
        "segurança",
        "crítico",
        "multi-plataforma",
        "multiplataforma",
        "micro-serviços",
        "microserviços",
      ];
  
      // Conta quantas palavras-chave de complexidade estão presentes na descrição
      const complexityKeywordCount = complexityKeywords.filter((keyword) =>
        description.includes(keyword)
      ).length;
  
      // Determina complexidade com base no tamanho da descrição e número de palavras-chave
      if (wordCount > 500 || complexityKeywordCount >= 3) {
        return "high";
      } else if (wordCount > 200 || complexityKeywordCount >= 1) {
        return "medium";
      } else {
        return "low";
      }
    };
  
    // Função para preencher cada campo do formulário com as respostas geradas
    const fillFormFields = async (formFields, responses) => {
      for (const field of formFields) {
        const response = responses[field.id];
        if (!response) continue;
  
        await smoothScrollTo(field.element);
  
        field.element.value = response;
  
        // Dispara eventos para garantir que o JavaScript do site reconheça as mudanças
        const event = new Event("input", { bubbles: true });
        field.element.dispatchEvent(event);
  
        // Pequena pausa entre preenchimentos para simular comportamento humano
        await new Promise((resolve) =>
          setTimeout(resolve, 300 + Math.random() * 200)
        );
      }
  
      return true;
    };
  
    // Função principal para preencher o formulário de proposta
    const fillBidForm = async () => {
      try {
        console.log("Iniciando processo de automação da proposta...");
  
        // 1. Primeiro extraímos as informações do projeto
        console.log("Passo 1: Extraindo informações do projeto...");
        const projectDetails = await extractProjectFromDetailBox();
  
        if (!projectDetails) {
          console.error("Não foi possível extrair os detalhes do projeto");
          return false;
        }
  
        // 2. Enviamos os detalhes para análise com o GPT
        console.log("Passo 2: Enviando para análise com GPT...");
        const gptAnalysis = await getProjectAnalysisFromGPT(projectDetails);
  
        if (!gptAnalysis) {
          console.warn(
            "Falha na análise GPT, continuando com informações limitadas"
          );
        }
  
        // 3. Coletamos os campos do formulário
        console.log("Passo 3: Coletando campos do formulário...");
        const formFields = await collectFormFields();
  
        if (formFields.length === 0) {
          console.error("Nenhum campo de formulário encontrado");
          return false;
        }
  
        // 4. Obtemos respostas para os campos (usando a análise do GPT)
        console.log("Passo 4: Gerando respostas para os campos do formulário...");
        const gptResult = await getAIResponses(projectDetails, formFields);
  
        if (!gptResult.success) {
          console.error("Falha ao gerar respostas para o formulário");
          return false;
        }
  
        // 5. Preenchemos os campos com as respostas geradas
        console.log(
          "Passo 5: Preenchendo campos do formulário com as respostas..."
        );
        await fillFormFields(formFields, gptResult.responses);
  
        // 6. Selecionamos as habilidades recomendadas pelo GPT
        console.log("Passo 6: Selecionando habilidades recomendadas pelo GPT...");
        await selectSkillsBasedOnGptAnalysis(projectDetails);
  
        console.log(
          "Formulário preenchido com sucesso e habilidades selecionadas!"
        );
        return true;
      } catch (error) {
        console.error("Erro ao preencher formulário de proposta:", error);
        return false;
      }
    };
  
    // Função para verificar se estamos na página de fazer proposta
    const isBidFormPage = () => {
      return document.querySelector(".box-common.project-bid") !== null;
    };
  
    // Verifica se estamos na página de proposta (após clicar no botão "Fazer uma proposta")
    if (isBidFormPage()) {
      // Aguarda um momento para garantir que o formulário está totalmente carregado
      setTimeout(async () => {
        await fillBidForm();
      }, 2000);
  
      return { action: "bid_form_filling_started", success: true };
    }
  
    // Verifica se estamos na página de projeto individual
    if (
      window.location.href.includes("/projects/") ||
      window.location.href.includes("/jobs/") ||
      window.location.pathname.includes("/job/")
    ) {
      console.log("Detectada página de projeto individual");
  
      // Função para tentar clicar no botão com várias tentativas
      const tryToClickBidButton = async (attempts = 0) => {
        if (attempts >= 10) {
          console.error("Falha ao encontrar o botão após várias tentativas");
          return false;
        }
  
        // Múltiplos seletores para garantir que encontremos o botão
        const bidButton =
          document.querySelector("#bid_button") ||
          document.querySelector("a.btn-primary.btn-xs-fixed") ||
          document.querySelector('a[href*="/messages/bid/"]') ||
          Array.from(document.querySelectorAll("a.btn-primary")).find((el) =>
            el.textContent.includes("Fazer uma proposta")
          );
  
        if (bidButton) {
          console.log("Botão 'Fazer uma proposta' encontrado");
  
          // Rola até o botão para garantir que está visível
          await smoothScrollTo(bidButton);
  
          // Clica no botão
          bidButton.click();
          return true;
        } else {
          // Tenta novamente após um curto intervalo
          setTimeout(() => tryToClickBidButton(attempts + 1), 1000);
          return false;
        }
      };
  
      // Inicia as tentativas de clicar no botão
      setTimeout(() => tryToClickBidButton(), 1500);
  
      return { action: "searching_bid_button" };
    }
  
    // Estamos na página de listagem de projetos - capturando todos os projetos
    const projects = [...document.querySelectorAll(".project-item")].map(
      (project) => {
        const titleElement = project.querySelector(".project-title");
        const linkElement = project.querySelector("a");
        const budgetElement = project.querySelector(".values span:first-child");
        const descriptionElement = project.querySelector(
          ".html-desc.project-details"
        );
  
        const title = titleElement
          ? titleElement.textContent.trim()
          : "Título não encontrado";
        const link = linkElement ? linkElement.href : "Link não encontrado";
        const budget = budgetElement
          ? budgetElement.textContent.trim()
          : "Valor não encontrado";
        const description = descriptionElement
          ? descriptionElement.textContent.replace("Ver mais detalhes", "").trim()
          : "Descrição não encontrada";
  
        return { title, link, budget, description };
      }
    );
  
    // Limpa storage e salva apenas os projetos atuais
    chrome.storage.local.clear(() => {
      chrome.storage.local.set({ capturedProjects: projects }, () => {
        // Salvo com sucesso
      });
    });
  
    return projects;
  })();
  