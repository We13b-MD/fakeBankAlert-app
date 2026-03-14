import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'; // Only this is needed
import './index.css';
import App from './App.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create React Query client
const queryClient = new QueryClient();

// Get root element
const container = document.getElementById('root')!;
const root = createRoot(container);

// Render app
root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
