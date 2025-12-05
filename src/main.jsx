import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

/**
 * Application entry point.
 * - Wraps the app in React.StrictMode.
 * - Sets up client-side routing with BrowserRouter.
 * - Applies some global accessibility defaults (language and title).
 */
const rootElement = document.getElementById('root');

// Ensure the <html> element has a language attribute for screen readers.
if (document.documentElement && !document.documentElement.lang) {
  document.documentElement.lang = 'en';
}

// Provide a title for the app (to display in the tabs of the browser).
document.title = 'test';

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}
