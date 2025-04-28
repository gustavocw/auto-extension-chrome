import usePopupController from "./controller";
import "./popup.css";

const Popup = () => {
 const { handleClick } = usePopupController();

  return (
    <div className="popup-container">
      <div className="popup-main">
        <div className="title-box">
          <h1 className="title">Find Work</h1>
          <p className="subtitle">Capture projetos do Workana com um clique</p>
        </div>

        <button onClick={handleClick} className="button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="icon"
          >
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
          Capturar Projetos
        </button>
      </div>

      <div className="footer">
        <p className="footer-text">
          Navegue até a página de projetos do Workana e clique no botão
        </p>
      </div>
    </div>
  );
};

export default Popup;
