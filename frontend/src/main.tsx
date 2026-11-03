import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Automatically handle chunk loading failures when a new deployment is published on Vercel
window.addEventListener('vite:preloadError', () => {
  const lastReload = sessionStorage.getItem('chunk_vite_preload_reload');
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload) > 10000) {
    sessionStorage.setItem('chunk_vite_preload_reload', now.toString());
    window.location.reload();
  }
});

window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (
    msg.includes('dynamically imported module') ||
    msg.includes('Failed to fetch') ||
    msg.includes('module script')
  ) {
    const lastReload = sessionStorage.getItem('chunk_global_error_reload');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload) > 10000) {
      sessionStorage.setItem('chunk_global_error_reload', now.toString());
      window.location.reload();
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
