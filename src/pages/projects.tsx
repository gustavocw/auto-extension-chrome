import { useState, useEffect } from 'react';
import './css/projects.css';
import { WorkanaProject, loadProjectsFromStorage } from '../utils/extract';

interface UserConfig {
  hourlyRate: string;
  aboutYou: string;
  marketingMethodology: string;
}

interface FilterOptions {
  minBudget: string;
  maxBudget: string;
}

const Projects = () => {
  const [projects, setProjects] = useState<WorkanaProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<WorkanaProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    minBudget: '',
    maxBudget: ''
  });
  const [userConfig, setUserConfig] = useState<UserConfig>(() => {
    return {
      hourlyRate: localStorage.getItem('workana_hourly_rate') || '100',
      aboutYou: localStorage.getItem('workana_about_you') || '',
      marketingMethodology: localStorage.getItem('workana_marketing_methodology') || '',
    };
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const loadedProjects = await loadProjectsFromStorage();
        setProjects(loadedProjects);
        setFilteredProjects(loadedProjects);
      } catch (error) {
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [filters, projects]);

  const filterProjects = () => {
    let result = [...projects];
    
    if (filters.minBudget) {
      result = result.filter(project => {
        const budget = extractBudgetValue(project.budget);
        return budget >= parseFloat(filters.minBudget);
      });
    }
    
    if (filters.maxBudget) {
      result = result.filter(project => {
        const budget = extractBudgetValue(project.budget);
        return budget <= parseFloat(filters.maxBudget);
      });
    }
    
    setFilteredProjects(result);
  };

  const extractBudgetValue = (budgetString: string): number => {
    const match = budgetString.match(/R\$\s*([\d.,]+)/);
    if (match && match[1]) {
      return parseFloat(match[1].replace('.', '').replace(',', '.'));
    }
    return 0;
  };

  const openProjectLink = (link: string) => {
    chrome.tabs.create({ url: link });
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserConfig(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'hourlyRate') {
      localStorage.setItem('workana_hourly_rate', value);
    } else if (name === 'aboutYou') {
      localStorage.setItem('workana_about_you', value);
    } else if (name === 'marketingMethodology') {
      localStorage.setItem('workana_marketing_methodology', value);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleConfig = () => {
    setShowConfig(!showConfig);
  };

  return (
    <div className="projects-container">
      <h1 className="projects-title">Find Work</h1>
      
      <div className="config-section">
        <button 
          className="config-toggle-button"
          onClick={toggleConfig}
        >
          {showConfig ? 'Esconder Configurações' : 'Mostrar Configurações'}
        </button>
        
        {showConfig && (
          <div className="config-panel">
            <div className="config-field">
              <label htmlFor="hourlyRate">Taxa horária (R$):</label>
              <input 
                type="number" 
                id="hourlyRate" 
                name="hourlyRate"
                value={userConfig.hourlyRate}
                onChange={handleConfigChange}
                className="config-input"
                min="1"
              />
            </div>
            
            <div className="config-field">
              <label htmlFor="aboutYou">Sobre você/sua empresa:</label>
              <textarea 
                id="aboutYou" 
                name="aboutYou"
                value={userConfig.aboutYou}
                onChange={handleConfigChange}
                className="config-textarea"
                placeholder="Descreva seu perfil profissional, projetos anteriores, habilidades, etc."
              />
            </div>
            
            <div className="config-field">
              <label htmlFor="marketingMethodology">Metodologia de marketing preferida:</label>
              <textarea 
                id="marketingMethodology" 
                name="marketingMethodology"
                value={userConfig.marketingMethodology}
                onChange={handleConfigChange}
                className="config-textarea"
                placeholder="Descreva sua abordagem de marketing, metodologia, ou qualquer informação específica"
              />
            </div>
            
            <div className="config-info">
              <p>Estas configurações serão usadas para personalizar as propostas geradas pelo GPT.</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="filters-section">
        <h2 className="filters-title">Filtrar projetos</h2>
        <div className="filters-container">
          <div className="filter-field">
            <label htmlFor="minBudget">Orçamento mínimo (R$):</label>
            <input 
              type="number" 
              id="minBudget" 
              name="minBudget"
              value={filters.minBudget}
              onChange={handleFilterChange}
              className="filter-input"
              min="0"
              placeholder="Min"
            />
          </div>
          
          <div className="filter-field">
            <label htmlFor="maxBudget">Orçamento máximo (R$):</label>
            <input 
              type="number" 
              id="maxBudget" 
              name="maxBudget"
              value={filters.maxBudget}
              onChange={handleFilterChange}
              className="filter-input"
              min="0"
              placeholder="Max"
            />
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="loading">
          <p>Carregando projetos...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="no-projects">
          <p>
            {projects.length === 0 
              ? "Nenhum projeto encontrado. Navegue até a página de listagem do Workana para capturar projetos." 
              : "Nenhum projeto corresponde aos filtros aplicados."}
          </p>
        </div>
      ) : (
        <div className="projects-list">
          {filteredProjects.map((project, index) => (
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