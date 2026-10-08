import React from 'react';
import ReactDOM from 'react-dom/client';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';
import '@fontsource-variable/inter';
import './styles.css';
import './dcp.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Theme Studio is development tooling. It is loaded through a dev-only dynamic import so it never
// enters the production module graph, and only when VITE_THEME_DEV=true (see .env.development).
if (import.meta.env.DEV && import.meta.env.VITE_THEME_DEV === 'true') {
  void import('./dev/mountAstryxThemeStudio').then(({ mountAstryxThemeStudio }) => {
    mountAstryxThemeStudio();
  });
}
