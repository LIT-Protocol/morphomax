import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

import './App.css';

import { JwtProvider, JwtContext } from '@/contexts/jwt';
import { Home } from '@/pages/home';
import { Login } from '@/pages/login';
import { Metrics } from '@/pages/metrics';
import { Background } from '@/components/ui/background';

function AppContent() {
  const { authInfo } = useContext(JwtContext);

  if (!authInfo) {
    return <Login />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/metrics" element={<Metrics />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <JwtProvider>
        <Background />
        <AppContent />
      </JwtProvider>
    </BrowserRouter>
  );
}

export default App;
