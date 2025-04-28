export default function usePopupController() {
  const handleClick = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id! },
          func: () => {
            const projects = [
              ...document.querySelectorAll(".project-item"),
            ].map((project) => {
              const titleElement = project.querySelector(".project-title");
              const linkElement = project.querySelector("a");
              const budgetElement = project.querySelector(
                ".values span:first-child"
              );
              const descriptionElement = project.querySelector(
                ".html-desc.project-details"
              );

              const title = titleElement
                ? titleElement.textContent?.trim() || "Título não encontrado"
                : "Título não encontrado";
              const link = linkElement
                ? linkElement.href
                : "Link não encontrado";
              const budget = budgetElement
                ? budgetElement.textContent?.trim() || "Valor não encontrado"
                : "Valor não encontrado";
              const description = descriptionElement
                ? descriptionElement.textContent
                    ?.replace("Ver mais detalhes", "")
                    .trim() || "Descrição não encontrada"
                : "Descrição não encontrada";

              return { title, link, budget, description };
            });

            return projects;
          },
        },
        (results) => {
          if (results && results[0].result) {
            const extractedProjects = results[0].result;
            console.log("Projetos extraídos:", extractedProjects);

            chrome.storage.local.set(
              { capturedProjects: extractedProjects },
              () => {
                console.log("Projetos salvos no storage:", extractedProjects);

                chrome.tabs.create({
                  url: chrome.runtime.getURL("src/pages/html/projects.html"),
                });
              }
            );
          } else {
            console.log("Nenhum projeto encontrado");
            chrome.tabs.create({
              url: chrome.runtime.getURL("src/pages/html/projects.html"),
            });
          }
        }
      );
    });
  };

  return { handleClick };
}
