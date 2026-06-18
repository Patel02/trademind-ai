import React from 'react';
import Dashboard from './pages/dashboard/Dashboard';

export const App: React.FC = () => {
  return (
    <div className="app-container">
      <header style={{ padding: '1rem', background: '#20232a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>TradeMind AI 🧠📈</h2>
        <nav>
          <span style={{ marginRight: '1rem' }}>Welcome to your workspace</span>
        </nav>
      </header>
      <main>
        <Dashboard />
      </main>
    </div>
  );
};

export default App;
