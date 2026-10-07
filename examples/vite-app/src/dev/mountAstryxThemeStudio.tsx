import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AstryxThemeStudio } from 'astryx-theme-studio/dev';

let root: Root | undefined;

export function mountAstryxThemeStudio() {
  if (root) return;

  const host = document.createElement('div');
  host.id = 'astryx-theme-studio-root';
  document.body.appendChild(host);

  root = createRoot(host);

  root.render(
    <React.StrictMode>
      <AstryxThemeStudio />
    </React.StrictMode>,
  );
}
