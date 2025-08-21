import { useContext } from 'react';
import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

import './App.css';

import { JwtProvider, JwtContext } from '@/contexts/jwt';
import { Home } from '@/pages/home';
import { Login } from '@/pages/login';
import { Background } from '@/components/shared/Background';

function AppContent() {
  const { authInfo } = useContext(JwtContext);

  return authInfo ? <Home /> : <Login />;
}

function App() {
  return (
    <JwtProvider>
      <Background />
      <AppContent />
    </JwtProvider>
  );
}

export default App;
