import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import JournalHeader from '../components/journal/JournalHeader';
import JournalList from '../components/journal/JournalList';
import JournalFab from '../components/journal/JournalFab';
import JournalPrompt from '../components/journal/JournalPrompt';
import { useGoalStore } from '../store/goalStore';

export default function JournalPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [promptKey, setPromptKey] = useState(0);
  const location = useLocation();
  const { goals } = useGoalStore();

  // Refresh prompt when navigating back to journal page
  useEffect(() => {
    setPromptKey(prev => prev + 1);
  }, [location.pathname]);

  const handleJournalSaved = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <JournalHeader />
      {goals.length > 0 && (
        <div key={`prompt-${promptKey}`}>
          <JournalPrompt />
        </div>
      )}
      <div key={`list-${refreshKey}`}>
        <JournalList />
      </div>
      <JournalFab onSave={handleJournalSaved} />
    </div>
  );
}