import React from 'react';
import './App.css';
import BackgroundRemover from './components/BackgroundRemover';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1 className="App-title-text">transparent.pics</h1>
          <p>Image Background Remover</p>
        </div>
      </header>
      <main>
        <BackgroundRemover />
      </main>
    </div>
  );
}

export default App;
