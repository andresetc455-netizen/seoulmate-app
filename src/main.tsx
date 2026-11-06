import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';
import './styles/premium.css';
import './lib/install';
import './lib/update';

function start() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Si vuelve del inicio de sesión de Microsoft, primero se completa (la librería se carga solo en ese caso).
if (/[?&](code|error)=/.test(location.search) && window.opener) {
  // Ventana emergente del inicio de sesión: la app que la abrió lee la respuesta y la cierra.
  document.getElementById('root')!.textContent = 'Conectando con Microsoft…';
} else if (/[?&](code|error)=/.test(location.search)) {
  import('./lib/onedrive')
    .then((m) => m.finishRedirectLogin())
    .catch(() => undefined)
    .finally(start);
} else start();
