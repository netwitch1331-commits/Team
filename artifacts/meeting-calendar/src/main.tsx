import { initTheme } from "./lib/theme";
initTheme();

import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
