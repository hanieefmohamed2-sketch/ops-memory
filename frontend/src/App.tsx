import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { NewIncidentPage } from './pages/NewIncidentPage';
import { IncidentsListPage } from './pages/IncidentsListPage';
import { KnowledgeExplorerPage } from './pages/KnowledgeExplorerPage';
import { KnowledgeDetailsPage } from './pages/KnowledgeDetailsPage';
import { DocumentUploadPage } from './pages/DocumentUploadPage';
import { IntelligencePage } from './pages/IntelligencePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ManagementPage } from './pages/ManagementPage';

import { InvestigationWorkspacePage } from './pages/InvestigationWorkspacePage';

export const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="incidents/new" element={<NewIncidentPage />} />
          <Route path="incidents/:id" element={<InvestigationWorkspacePage />} />
          <Route path="incidents" element={<IncidentsListPage />} />
          <Route path="knowledge/upload" element={<DocumentUploadPage />} />
          <Route path="upload" element={<DocumentUploadPage />} />
          <Route path="knowledge/:id" element={<KnowledgeDetailsPage />} />
          <Route path="knowledge" element={<KnowledgeExplorerPage />} />
          <Route path="intelligence" element={<IntelligencePage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="management" element={<ManagementPage />} />
          {/* Catch-all redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};


export default App;
