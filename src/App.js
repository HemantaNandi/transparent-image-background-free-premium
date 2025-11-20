import React from 'react';
import './App.css';
import BackgroundRemover from './components/BackgroundRemover';
import Footer from './components/Footer/Footer';

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
      <Footer />
    </div>
  );
}

export default App;
