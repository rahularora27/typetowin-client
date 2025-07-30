import { useState } from 'react';
import HomePage from './pages/HomePage';
import SinglePlayer from './pages/SinglePlayer';

function App() {
  const [mode, setMode] = useState<'home' | 'singleplayer'>('home');

  const handleSelectSinglePlayer = () => {
    setMode('singleplayer');
  };

  if (mode === 'singleplayer') {
    return <SinglePlayer />;
  }

  return <HomePage onSelectSinglePlayer={handleSelectSinglePlayer} />;
}

export default App;