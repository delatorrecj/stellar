import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Onboarding } from './pages/Onboarding';
import { Employer } from './pages/Employer';
import { Candidate } from './pages/Candidate';
import { Arbitrator } from './pages/Arbitrator';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/employer" element={<Employer />} />
          <Route path="/candidate" element={<Candidate />} />
          <Route path="/arbitrator" element={<Arbitrator />} />
          {/* Catch-all: return to role selection */}
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
