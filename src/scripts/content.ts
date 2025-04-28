import { fillProjectQuestions } from '../modules/InitialFillQuestions';
import { scanProject } from '../modules/ScanProject';

async function runSequence() {
  await scanProject();
  await fillProjectQuestions();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runSequence);
} else {
  runSequence();
}
