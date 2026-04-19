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
      <Routes>
        {/* Landing page is full bleed, no sidebar */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Protected workspace routes with Layout */}
        <Route 
          path="/employer" 
          element={
            <Layout>
              <Employer />
            </Layout>
          } 
        />
        <Route 
          path="/candidate" 
          element={
            <Layout>
              <Candidate />
            </Layout>
          } 
        />
        <Route 
          path="/arbitrator" 
          element={
            <Layout>
              <Arbitrator />
            </Layout>
          } 
        />

        {/* Catch-all: return home */}
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
