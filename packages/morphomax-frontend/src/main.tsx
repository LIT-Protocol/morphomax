import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import App from './App';

import { env } from '@/config/env';

const { VITE_IS_DEVELOPMENT } = env;

Sentry.init({
  dsn: 'https://8cb585972c53742046198c754d93b743@o4509482456842240.ingest.us.sentry.io/4509842364956672',
  enabled: !VITE_IS_DEVELOPMENT,
  sendDefaultPii: true,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
