import { fillProjectQuestions } from '../modules/InitialFillQuestions';
import { scanProject } from '../modules/ScanProjects/ScanProject';

async function runSequence() {
  const currentUrl = window.location.href;

  if (currentUrl.includes('workana.com/job/')) {
    console.log('Página de projeto detectada.');
    await scanProject();
  } else if (currentUrl.includes('workana.com/messages/bid/')) {
    console.log('Página de envio de proposta detectada.');
    await fillProjectQuestions(); // Só aqui preenche os inputs
  } else {
    console.log('Não está na página de projeto nem na página de proposta. Executando apenas scanProject.');
    await scanProject();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runSequence);
} else {
  runSequence();
}
