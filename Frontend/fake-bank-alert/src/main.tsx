import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'; // Only this is needed
import './index.css';
import App from './App.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';

// Configure global Axios settings
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;

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
