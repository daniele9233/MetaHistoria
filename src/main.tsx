import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/400-italic.css';
import '@fontsource-variable/inter';

import './styles/base.css';
import './styles/masthead.css';
import './styles/scene.css';
import './styles/hero-page.css';
import './styles/sheet.css';
import './styles/reader.css';
import './styles/editorial.css';
import './styles/pages.css';
import './styles/book.css';
import './styles/cinematic.css';
import './styles/relief.css';

import App from './App';
import { RouterProvider } from './lib/router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider>
      <App />
    </RouterProvider>
  </StrictMode>,
);
