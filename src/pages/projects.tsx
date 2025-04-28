import { useState, useEffect } from 'react';
import './css/projects.css';
import { WorkanaProject, loadProjectsFromStorage } from '../utils/extract';

const Projects = () => {
  const [projects, setProjects] = useState<WorkanaProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const loadedProjects = await loadProjectsFromStorage();
        console.log('Projetos carregados:', loadedProjects);
        setProjects(loadedProjects);
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const openProjectLink = (link: string) => {
    chrome.tabs.create({ url: link });
  };

  return (
    <div className="projects-container">
      <h1 className="projects-title">Find Work</h1>
      
      {loading ? (
        <div className="loading">
          <p>Carregando projetos...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="no-projects">
          <p>
            Nenhum projeto encontrado. Navegue até a página de listagem do Workana para capturar projetos.
          </p>
        </div>
      ) : (
        <div className="projects-list">
          {projects.map((project, index) => (
            <div 
              key={index}
              className="project-card"
              onClick={() => openProjectLink(project.link)}
            >
              <div className="project-header">
                <h2 className="project-title">{project.title}</h2>
                <span className="project-budget">{project.budget}</span>
              </div>
              <p className="project-description">{project.description}</p>
              <div className="project-actions">
                <button 
                  className="view-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openProjectLink(project.link);
                  }}
                >
                  Automatizar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;