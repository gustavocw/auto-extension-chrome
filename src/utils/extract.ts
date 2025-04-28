export interface WorkanaProject {
  title: string;
  link: string;
  budget: string;
  description: string;
}

export const saveProjectsToStorage = (projects: WorkanaProject[]): void => {
  chrome.storage.local.clear(() => {
    chrome.storage.local.set({ capturedProjects: projects }, () => {
      console.log("Projetos salvos com sucesso!");
    });
  });
};


export const loadProjectsFromStorage = (): Promise<WorkanaProject[]> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(["capturedProjects"], (result) => {
      resolve(result.capturedProjects || []);
    });
  });
};