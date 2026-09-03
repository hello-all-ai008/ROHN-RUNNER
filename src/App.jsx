import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RunnerProvider } from './context/RunnerContext';

import Home from './pages/Home';
import Scanner from './pages/Scanner';
import Monitor from './pages/Monitor';
import ESlip from './pages/ESlip';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';

function App() {
  return (
    <RunnerProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/monitor/:id" element={<Monitor />} />
          <Route path="/eslip" element={<ESlip />} />
          <Route path="/eslip/:bib" element={<ESlip />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </Router>
    </RunnerProvider>
  );
}

export default App;
