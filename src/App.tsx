import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import TabBar from './components/layout/TabBar';
import CollectionPage from './pages/CollectionPage';
import JournalPage from './pages/JournalPage';
import JournalDetailPage from './pages/JournalDetailPage';
import JournalEditPage from './pages/JournalEditPage';
import JournalNewPage from './pages/JournalNewPage';
import SettingsPage from './pages/SettingsPage';
import GoalSetupPage from './pages/GoalSetupPage';
import AuthForm from './components/auth/AuthForm';
import AuthRequired from './components/auth/AuthRequired';
import UsageGuideSheet from './components/settings/UsageGuideSheet';
import { useState } from 'react';

function App() {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/auth" element={<AuthForm />} />
        
        {/* Protected routes */}
        <Route element={<AuthRequired onFirstLogin={() => setShowGuide(true)} />}>
          {/* Goal setup route - no TabBar */}
          <Route path="/goal-setup" element={<GoalSetupPage />} />
          
          {/* Main app routes (with TabBar) */}
          <Route element={
            <div className="min-h-screen bg-gray-50 pb-16">
              <Outlet />
              <TabBar />
            </div>
          }>
            <Route path="/" element={<Navigate to="/journal" replace />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/journal/new" element={<JournalNewPage />} />
            <Route path="/journal/:id" element={<JournalDetailPage />} />
            <Route path="/journal/:id/edit" element={<JournalEditPage />} />
            <Route path="/collection" element={<CollectionPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
      <UsageGuideSheet isOpen={showGuide} onClose={() => setShowGuide(false)} />
    </Router>
  );
}

export default App;