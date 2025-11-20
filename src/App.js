import React, { useEffect } from 'react';
import './App.css';
import BackgroundRemover from './components/BackgroundRemover';

function App() {
  useEffect(() => {
    document.title = 'Free AI Image Background Remover | transparent.pics';
  }, []);
  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1 className="App-title-text">transparent.pics</h1>
          <h2>Free AI Image Background Remover</h2>
        </div>
      </header>
      <main>
        <BackgroundRemover />
      </main>
    </div>
  );
}

export default App;
