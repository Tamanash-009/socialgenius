import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import './index.css';

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-[#0A0118] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="p-8 rounded-3xl glass-card border border-red-500/30 max-w-lg w-full">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h2>
        <p className="text-white/60 mb-6 break-words font-mono text-xs">{error.message}</p>
        <button onClick={() => window.location.reload()} className="glass-button px-6 py-2">
          Refresh Page
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <HelmetProvider>
        <App />
        <Toaster 
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1F1235',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        />
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
);
